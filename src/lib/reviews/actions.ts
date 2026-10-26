"use server";

import { and, count, eq, gte } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { recomputeGameScores } from "@/db/aggregates";
import { gameStatuses, games, reports, userReviews } from "@/db/schema";
import { ensureHandle } from "@/lib/newsroom/handles";
import { tags } from "@/lib/queries/games";
import {
  AUTO_HIDE_REPORTS,
  reportReasons,
  reviewPlayStatuses,
  USER_REVIEW_MAX_CHARS,
} from "@/lib/reviews/constants";
import { getSession } from "@/lib/session";

/**
 * Reviews do público. Toda ação exige sessão e opera só sobre os dados de quem está logado.
 * Erros esperados voltam como { ok: false, error } para a UI exibir a mensagem certa.
 */

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: "auth" | "invalid" | "rate_limited" | "not_found" | "own" };

async function invalidateGame(gameId: string) {
  await recomputeGameScores(db, gameId);
  const [game] = await db.select({ slug: games.slug }).from(games).where(eq(games.id, gameId)).limit(1);
  if (game) updateTag(tags.game(game.slug));
  updateTag(tags.gameReviews(gameId));
  updateTag(tags.games);
}

/** Limites simples por janela de tempo, contados no próprio banco (sem infraestrutura extra). */
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);

async function tooManyReviews(userId: string) {
  const [{ n }] = await db
    .select({ n: count() })
    .from(userReviews)
    .where(and(eq(userReviews.userId, userId), gte(userReviews.createdAt, minutesAgo(10))));
  return n >= 10;
}

async function tooManyReports(userId: string) {
  const [{ n }] = await db
    .select({ n: count() })
    .from(reports)
    .where(and(eq(reports.reporterId, userId), gte(reports.createdAt, minutesAgo(60))));
  return n >= 20;
}

const reviewInput = z.object({
  gameId: z.uuid(),
  score: z
    .number()
    .min(0)
    .max(10)
    .refine((n) => Number.isInteger(n * 2)),
  body: z.string().trim().max(USER_REVIEW_MAX_CHARS),
  hasSpoilers: z.boolean(),
  status: z.enum(reviewPlayStatuses).nullable(),
});
export type UserReviewInput = z.input<typeof reviewInput>;

export async function saveUserReview(input: UserReviewInput): Promise<Result<{ gameSlug: string }>> {
  const session = await getSession();
  if (!session) return { ok: false, error: "auth" };
  const parsed = reviewInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { gameId, score, body, hasSpoilers, status } = parsed.data;
  const userId = session.user.id;

  const [game] = await db.select({ slug: games.slug }).from(games).where(eq(games.id, gameId)).limit(1);
  if (!game) return { ok: false, error: "not_found" };

  const [existing] = await db
    .select({ id: userReviews.id })
    .from(userReviews)
    .where(and(eq(userReviews.gameId, gameId), eq(userReviews.userId, userId)))
    .limit(1);
  // Só novas reviews contam para o limite; editar a própria é livre.
  if (!existing && (await tooManyReviews(userId))) {
    return { ok: false, error: "rate_limited" };
  }

  await ensureHandle(userId);
  await db
    .insert(userReviews)
    .values({ gameId, userId, score, body: body || null, hasSpoilers: Boolean(body) && hasSpoilers })
    .onConflictDoUpdate({
      target: [userReviews.gameId, userReviews.userId],
      // Editar não "desoculta" uma review que a moderação escondeu.
      set: { score, body: body || null, hasSpoilers: Boolean(body) && hasSpoilers, updatedAt: new Date() },
    });

  if (status) {
    await db
      .insert(gameStatuses)
      .values({ userId, gameId, status })
      .onConflictDoUpdate({ target: [gameStatuses.userId, gameStatuses.gameId], set: { status } });
  }

  await invalidateGame(gameId);
  return { ok: true, gameSlug: game.slug };
}

export async function deleteUserReview(gameId: string): Promise<Result> {
  const session = await getSession();
  if (!session) return { ok: false, error: "auth" };
  const id = z.uuid().safeParse(gameId);
  if (!id.success) return { ok: false, error: "invalid" };

  const deleted = await db
    .delete(userReviews)
    .where(and(eq(userReviews.gameId, id.data), eq(userReviews.userId, session.user.id)))
    .returning({ id: userReviews.id });
  if (!deleted.length) return { ok: false, error: "not_found" };

  await invalidateGame(id.data);
  refresh();
  return { ok: true };
}

export async function reportUserReview(reviewId: string, reason: string): Promise<Result<{ hidden: boolean }>> {
  const session = await getSession();
  if (!session) return { ok: false, error: "auth" };
  const parsed = z.object({ reviewId: z.uuid(), reason: z.enum(reportReasons) }).safeParse({ reviewId, reason });
  if (!parsed.success) return { ok: false, error: "invalid" };

  const [review] = await db
    .select({ userId: userReviews.userId, gameId: userReviews.gameId })
    .from(userReviews)
    .where(eq(userReviews.id, parsed.data.reviewId))
    .limit(1);
  if (!review) return { ok: false, error: "not_found" };
  if (review.userId === session.user.id) return { ok: false, error: "own" };
  if (await tooManyReports(session.user.id)) return { ok: false, error: "rate_limited" };

  // Uma denúncia por pessoa por review (índice único); repetir é ignorado sem erro.
  await db
    .insert(reports)
    .values({ target: "user_review", targetId: parsed.data.reviewId, reporterId: session.user.id, reason: parsed.data.reason })
    .onConflictDoNothing();

  const [{ open }] = await db
    .select({ open: count() })
    .from(reports)
    .where(and(eq(reports.target, "user_review"), eq(reports.targetId, parsed.data.reviewId), eq(reports.status, "open")));

  const hidden = open >= AUTO_HIDE_REPORTS;
  if (hidden) {
    await db.update(userReviews).set({ visibility: "hidden" }).where(eq(userReviews.id, parsed.data.reviewId));
    await invalidateGame(review.gameId);
  }
  return { ok: true, hidden };
}
