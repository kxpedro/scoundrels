"use server";

import { and, count, eq } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { recomputeGameScores } from "@/db/aggregates";
import { comments, criticReviews, games, reports, reviewLikes, user, userReviews } from "@/db/schema";
import { isLocale } from "@/i18n/config";
import { sanitizeDoc, wordCount } from "@/lib/editor/sanitize";
import { getIgdbGame, IgdbNotConfiguredError, searchIgdbGames, type IgdbGame } from "@/lib/igdb";
import { canArchive, canDecide, canDelete, canEdit, canPublish, canSubmit } from "@/lib/newsroom/permissions";
import { catalogIgdbIds } from "@/lib/newsroom/queries";
import { createManualGame, upsertIgdbGame } from "@/lib/newsroom/catalog";
import { ensureHandle } from "@/lib/newsroom/handles";
import { tags } from "@/lib/queries/games";
import { getSession } from "@/lib/session";
import { hasRole, isRole, type Role } from "@/lib/session-roles";

/**
 * Server Actions são endpoints POST públicos: toda ação revalida sessão e permissão aqui,
 * independente do que a UI esconde.
 */
async function actor(required: Role) {
  const session = await getSession();
  if (!session || !hasRole(session.user.role, required)) throw new Error("Sem permissão");
  return { id: session.user.id, role: session.user.role, name: session.user.name };
}

async function loadReview(id: string) {
  const [review] = await db.select().from(criticReviews).where(eq(criticReviews.id, z.uuid().parse(id))).limit(1);
  if (!review) throw new Error("Review não encontrada");
  return review;
}

/** Invalida tudo que mostra a review/jogo no site público. */
async function invalidatePublic(gameId: string, reviewSlug: string) {
  const [game] = await db.select({ slug: games.slug }).from(games).where(eq(games.id, gameId)).limit(1);
  await recomputeGameScores(db, gameId);
  if (game) updateTag(tags.game(game.slug));
  updateTag(tags.gameReviews(gameId));
  updateTag(tags.review(reviewSlug));
  updateTag(tags.games);
}

const langOf = (formData: FormData) => {
  const lang = String(formData.get("lang") ?? "pt");
  return isLocale(lang) ? lang : "pt";
};

/* ───────────────────────── Reviews ───────────────────────── */

export async function createReviewDraft(formData: FormData) {
  const me = await actor("critic");
  const lang = langOf(formData);
  const gameId = z.uuid().parse(formData.get("gameId"));

  const [existing] = await db
    .select({ id: criticReviews.id })
    .from(criticReviews)
    .where(and(eq(criticReviews.authorId, me.id), eq(criticReviews.gameId, gameId), eq(criticReviews.locale, lang)))
    .limit(1);

  const id =
    existing?.id ??
    (
      await db
        .insert(criticReviews)
        .values({
          gameId,
          authorId: me.id,
          locale: lang,
          title: "",
          // Slug provisório; o definitivo é gerado ao publicar.
          slug: `rascunho-${crypto.randomUUID()}`,
          body: { type: "doc", content: [] },
        })
        .returning({ id: criticReviews.id })
    )[0].id;

  redirect(`/${lang}/redacao/reviews/${id}`);
}

const reviewInput = z.object({
  title: z.string().max(160),
  excerpt: z.string().max(280),
  score: z
    .number()
    .min(0)
    .max(10)
    .refine((n) => Number.isInteger(n * 2), "Passos de 0,5")
    .nullable(),
  platformTestedId: z.number().int().positive().nullable(),
  pros: z.array(z.string().trim().min(1).max(120)).max(8),
  cons: z.array(z.string().trim().min(1).max(120)).max(8),
  body: z.unknown(),
});
export type ReviewInput = z.input<typeof reviewInput>;

export async function saveReview(id: string, input: ReviewInput): Promise<{ ok: true; savedAt: string } | { ok: false; error: string }> {
  const me = await actor("critic");
  const review = await loadReview(id);
  if (!canEdit(me, review)) return { ok: false, error: "forbidden" };

  const parsed = reviewInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const data = parsed.data;

  const [saved] = await db
    .update(criticReviews)
    .set({
      title: data.title.trim(),
      excerpt: data.excerpt.trim() || null,
      score: data.score,
      platformTestedId: data.platformTestedId,
      pros: data.pros,
      cons: data.cons,
      body: sanitizeDoc(data.body),
    })
    .where(eq(criticReviews.id, id))
    .returning({ updatedAt: criticReviews.updatedAt });

  // Edição de algo já publicado vai direto para o site.
  if (review.status === "published") await invalidatePublic(review.gameId, review.slug);

  return { ok: true, savedAt: saved.updatedAt.toISOString() };
}

function isComplete(r: typeof criticReviews.$inferSelect) {
  return Boolean(r.title.trim()) && r.score !== null && wordCount(sanitizeDoc(r.body)) > 0;
}

export async function submitReview(id: string) {
  const me = await actor("critic");
  const review = await loadReview(id);
  if (!canSubmit(me, review)) throw new Error("Sem permissão");
  if (!isComplete(review)) throw new Error("incomplete");

  await db
    .update(criticReviews)
    .set({ status: "in_review", submittedAt: new Date() })
    .where(eq(criticReviews.id, id));
  refresh();
}

export async function requestChanges(id: string, note: string) {
  const me = await actor("editor");
  const review = await loadReview(id);
  if (!canDecide(me, review)) throw new Error("Sem permissão");

  await db
    .update(criticReviews)
    .set({ status: "changes_requested", editorId: me.id, editorNote: z.string().trim().min(1).max(1000).parse(note) })
    .where(eq(criticReviews.id, id));
  refresh();
}

export async function publishReview(id: string) {
  const me = await actor("editor");
  const review = await loadReview(id);
  if (!canPublish(me, review)) throw new Error("Sem permissão");
  if (!isComplete(review)) throw new Error("incomplete");

  const [[game], handle] = await Promise.all([
    db.select({ slug: games.slug }).from(games).where(eq(games.id, review.gameId)).limit(1),
    ensureHandle(review.authorId),
  ]);
  // Slug definitivo: jogo + autor (+ idioma quando não for o padrão). Mantido em republicações.
  const slug = review.slug.startsWith("rascunho-")
    ? [game.slug, handle, review.locale !== "pt" && review.locale].filter(Boolean).join("-")
    : review.slug;

  await db
    .update(criticReviews)
    .set({
      status: "published",
      slug,
      editorId: me.id,
      editorNote: null,
      publishedAt: review.publishedAt ?? new Date(),
    })
    .where(eq(criticReviews.id, id));

  await invalidatePublic(review.gameId, slug);
  refresh();
}

/* ───────────────────────── Catálogo / IGDB ───────────────────────── */

export type IgdbSearchResult =
  | { ok: true; games: Array<IgdbGame & { inCatalog: boolean }> }
  | { ok: false; error: "not_configured" | "failed" };

export async function searchIgdb(term: string): Promise<IgdbSearchResult> {
  await actor("editor");
  const q = z.string().trim().min(2).max(100).safeParse(term);
  if (!q.success) return { ok: true, games: [] };
  try {
    const results = await searchIgdbGames(q.data);
    const known = await catalogIgdbIds(results.map((g) => g.id));
    return { ok: true, games: results.map((g) => ({ ...g, inCatalog: known.has(g.id) })) };
  } catch (err) {
    if (err instanceof IgdbNotConfiguredError) return { ok: false, error: "not_configured" };
    console.error(err);
    return { ok: false, error: "failed" };
  }
}

export async function importIgdbGame(igdbId: number): Promise<{ ok: boolean; slug?: string }> {
  await actor("editor");
  const game = await getIgdbGame(z.number().int().positive().parse(igdbId));
  if (!game) return { ok: false };
  const saved = await upsertIgdbGame(game);
  updateTag(tags.game(saved.slug));
  updateTag(tags.games);
  refresh();
  return { ok: true, slug: saved.slug };
}

export async function createGameManually(formData: FormData) {
  await actor("editor");
  const title = z.string().trim().min(1).max(160).parse(formData.get("title"));
  const date = z.iso.date().nullable().catch(null).parse(formData.get("releaseDate") || null);
  await createManualGame(title, date);
  updateTag(tags.games);
  refresh();
}

/* ───────────────────────── Equipe ───────────────────────── */

export async function setUserRole(formData: FormData): Promise<{ ok: boolean; error?: "not_found" | "self" }> {
  const me = await actor("admin");
  const email = z.email().parse(String(formData.get("email") ?? "").trim().toLowerCase());
  const role = String(formData.get("role"));
  if (!isRole(role)) throw new Error("Papel inválido");

  const [target] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
  if (!target) return { ok: false, error: "not_found" };
  if (target.id === me.id) return { ok: false, error: "self" };

  await db
    .update(user)
    .set({ role, title: z.string().trim().max(60).nullable().catch(null).parse(formData.get("title") || null) })
    .where(eq(user.id, target.id));
  if (role !== "user") await ensureHandle(target.id);
  updateTag(tags.games); // lista pública de críticos
  refresh();
  return { ok: true };
}

/* ───────────────────────── Denúncias ───────────────────────── */

export async function resolveReport(formData: FormData) {
  const me = await actor("editor");
  const id = z.uuid().parse(formData.get("id"));
  const decision = z.enum(["hide", "dismiss"]).parse(formData.get("decision"));

  const [report] = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
  if (!report || report.status !== "open") return;

  // Ocultar confirma a moderação; descartar devolve ao ar o que a ocultação automática escondeu.
  const visibility = decision === "hide" ? "hidden" : "visible";
  if (report.target === "user_review") {
    const [review] = await db
      .update(userReviews)
      .set({ visibility })
      .where(eq(userReviews.id, report.targetId))
      .returning({ gameId: userReviews.gameId });
    if (review) {
      await recomputeGameScores(db, review.gameId);
      const [game] = await db.select({ slug: games.slug }).from(games).where(eq(games.id, review.gameId)).limit(1);
      if (game) updateTag(tags.game(game.slug));
      updateTag(tags.gameReviews(review.gameId));
    }
  } else {
    await db.update(comments).set({ visibility }).where(eq(comments.id, report.targetId));
  }

  // Fecha todas as denúncias abertas do mesmo alvo de uma vez.
  await db
    .update(reports)
    .set({ status: decision === "hide" ? "resolved" : "dismissed", resolvedById: me.id, resolvedAt: new Date() })
    .where(and(eq(reports.target, report.target), eq(reports.targetId, report.targetId), eq(reports.status, "open")));
  refresh();
}

/* ───────────────────────── Arquivar / excluir reviews ───────────────────────── */

/** Tira a crítica do site (status "archived"); pode ser republicada depois. */
export async function archiveReview(id: string) {
  const me = await actor("editor");
  const review = await loadReview(id);
  if (!canArchive(me, review)) throw new Error("Sem permissão");
  await db.update(criticReviews).set({ status: "archived", editorId: me.id }).where(eq(criticReviews.id, id));
  await invalidatePublic(review.gameId, review.slug);
  refresh();
}

/** Apaga de vez a crítica, com curtidas e comentários (que não têm FK por serem polimórficos). */
export async function deleteReview(id: string): Promise<{ ok: true } | { ok: false; error: "forbidden" }> {
  const me = await actor("critic");
  const review = await loadReview(id);
  if (!canDelete(me, review)) return { ok: false, error: "forbidden" };

  await db.transaction(async (tx) => {
    await tx.delete(reviewLikes).where(and(eq(reviewLikes.reviewKind, "critic"), eq(reviewLikes.reviewId, id)));
    await tx.delete(comments).where(and(eq(comments.reviewKind, "critic"), eq(comments.reviewId, id)));
    await tx.delete(criticReviews).where(eq(criticReviews.id, id));
  });
  if (review.status === "published") await invalidatePublic(review.gameId, review.slug);
  return { ok: true };
}

/* ───────────────────────── Gestão de jogos ───────────────────────── */

type GameResult = { ok: true; slug?: string } | { ok: false; error: "invalid" | "slug_taken" | "has_reviews" | "no_igdb" | "not_found" };

async function loadGame(id: string) {
  if (!z.uuid().safeParse(id).success) return null;
  const [game] = await db.select().from(games).where(eq(games.id, id)).limit(1);
  return game ?? null;
}

/** Invalida o jogo (pelo slug antigo e pelo novo, se mudou) e as listagens. */
function invalidateGame(gameId: string, ...slugs: string[]) {
  for (const slug of new Set(slugs)) updateTag(tags.game(slug));
  updateTag(tags.gameReviews(gameId));
  updateTag(tags.games);
  updateTag(tags.lists);
}

const gameInput = z.object({
  title: z.string().trim().min(1).max(160),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(80),
  releaseDate: z.iso.date().nullable(),
  coverUrl: z.url({ protocol: /^https$/ }).max(500).nullable(),
  summary: z.string().trim().max(2000),
});
export type GameInput = z.input<typeof gameInput>;

export async function updateGame(id: string, input: GameInput): Promise<GameResult> {
  await actor("editor");
  const game = await loadGame(id);
  if (!game) return { ok: false, error: "not_found" };
  const parsed = gameInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const data = parsed.data;

  if (data.slug !== game.slug) {
    const [taken] = await db.select({ id: games.id }).from(games).where(eq(games.slug, data.slug)).limit(1);
    if (taken) return { ok: false, error: "slug_taken" };
  }
  await db
    .update(games)
    .set({ title: data.title, slug: data.slug, releaseDate: data.releaseDate, coverUrl: data.coverUrl, summary: data.summary || null })
    .where(eq(games.id, id));
  invalidateGame(id, game.slug, data.slug);
  return { ok: true, slug: data.slug };
}

export async function setGameArchived(id: string, archived: boolean): Promise<GameResult> {
  await actor("editor");
  const game = await loadGame(id);
  if (!game) return { ok: false, error: "not_found" };
  await db.update(games).set({ archivedAt: archived ? new Date() : null }).where(eq(games.id, id));
  invalidateGame(id, game.slug);
  refresh();
  return { ok: true };
}

/** Exclusão definitiva: só admin e só sem nenhuma review (crítica ou do público). */
export async function deleteGame(id: string): Promise<GameResult> {
  await actor("admin");
  const game = await loadGame(id);
  if (!game) return { ok: false, error: "not_found" };
  const [[critics], [users]] = await Promise.all([
    db.select({ n: count() }).from(criticReviews).where(eq(criticReviews.gameId, id)),
    db.select({ n: count() }).from(userReviews).where(eq(userReviews.gameId, id)),
  ]);
  if (critics.n + users.n > 0) return { ok: false, error: "has_reviews" };
  await db.delete(games).where(eq(games.id, id)); // cascade: gêneros, plataformas, estúdios, status, itens de lista
  invalidateGame(id, game.slug);
  refresh();
  return { ok: true };
}

/** Recarrega do IGDB título, capa, data, resumo, gêneros, plataformas e estúdios (o slug é mantido). */
export async function resyncGame(id: string): Promise<GameResult> {
  await actor("editor");
  const game = await loadGame(id);
  if (!game) return { ok: false, error: "not_found" };
  if (!game.igdbId) return { ok: false, error: "no_igdb" };
  const fresh = await getIgdbGame(game.igdbId);
  if (!fresh) return { ok: false, error: "not_found" };
  await upsertIgdbGame(fresh);
  invalidateGame(id, game.slug);
  return { ok: true, slug: game.slug };
}
