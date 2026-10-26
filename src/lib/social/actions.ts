"use server";

import { and, asc, count, desc, eq, gt, gte, inArray, lt, max, sql } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import {
  comments,
  criticReviews,
  follows,
  gameStatuses,
  games,
  listItems,
  listLikes,
  lists,
  reports,
  reviewLikes,
  user,
  userReviews,
} from "@/db/schema";
import { ensureHandle } from "@/lib/newsroom/handles";
import { tags } from "@/lib/queries/games";
import { AUTO_HIDE_REPORTS, reportReasons } from "@/lib/reviews/constants";
import { getSession } from "@/lib/session";
import {
  COMMENT_MAX_CHARS,
  commentKinds,
  HANDLE_PATTERN,
  likeKinds,
  LIST_MAX_ITEMS,
  playStatuses,
  type CommentKind,
  type LikeKind,
} from "@/lib/social/constants";
import { slugify } from "@/lib/slug";

/**
 * Ações sociais. Todas exigem sessão e só alteram dados de quem está logado
 * (exceto moderação, que fica na redação). Erros esperados voltam como { ok: false }.
 */

type Fail = { ok: false; error: "auth" | "invalid" | "not_found" | "own" | "rate_limited" | "taken" | "full" };

async function me() {
  const session = await getSession();
  return session?.user ?? null;
}

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);

/** Tags públicas afetadas por mudanças numa review (jogo, página da crítica, perfil do autor). */
async function invalidateReview(kind: CommentKind, reviewId: string) {
  if (kind === "critic") {
    const [r] = await db
      .select({ slug: criticReviews.slug, gameId: criticReviews.gameId })
      .from(criticReviews)
      .where(eq(criticReviews.id, reviewId))
      .limit(1);
    if (r) {
      updateTag(tags.review(r.slug));
      updateTag(tags.gameReviews(r.gameId));
    }
  } else {
    const [r] = await db
      .select({ gameId: userReviews.gameId, userId: userReviews.userId })
      .from(userReviews)
      .where(eq(userReviews.id, reviewId))
      .limit(1);
    if (r) {
      updateTag(tags.gameReviews(r.gameId));
      updateTag(tags.user(r.userId));
    }
  }
}

/* ───────────────────────── Curtidas ───────────────────────── */

async function likeTarget(kind: LikeKind, id: string) {
  if (kind === "list") {
    const [l] = await db.select({ ownerId: lists.userId, isPublic: lists.isPublic }).from(lists).where(eq(lists.id, id)).limit(1);
    return l && l.isPublic ? { ownerId: l.ownerId } : null;
  }
  if (kind === "critic") {
    const [r] = await db
      .select({ ownerId: criticReviews.authorId })
      .from(criticReviews)
      .where(and(eq(criticReviews.id, id), eq(criticReviews.status, "published")))
      .limit(1);
    return r ?? null;
  }
  const [r] = await db
    .select({ ownerId: userReviews.userId })
    .from(userReviews)
    .where(and(eq(userReviews.id, id), eq(userReviews.visibility, "visible")))
    .limit(1);
  return r ?? null;
}

/** Liga/desliga a curtida e devolve o estado e o total atualizados. */
export async function toggleLike(kind: LikeKind, id: string): Promise<{ ok: true; liked: boolean; count: number } | Fail> {
  const viewer = await me();
  if (!viewer) return { ok: false, error: "auth" };
  const parsed = z.object({ kind: z.enum(likeKinds), id: z.uuid() }).safeParse({ kind, id });
  if (!parsed.success) return { ok: false, error: "invalid" };

  const target = await likeTarget(kind, id);
  if (!target) return { ok: false, error: "not_found" };
  if (target.ownerId === viewer.id) return { ok: false, error: "own" };

  let liked: boolean;
  if (kind === "list") {
    const removed = await db
      .delete(listLikes)
      .where(and(eq(listLikes.userId, viewer.id), eq(listLikes.listId, id)))
      .returning({ id: listLikes.listId });
    liked = removed.length === 0;
    if (liked) await db.insert(listLikes).values({ userId: viewer.id, listId: id }).onConflictDoNothing();
    const [{ n }] = await db.select({ n: count() }).from(listLikes).where(eq(listLikes.listId, id));
    await db.update(lists).set({ likeCount: n }).where(eq(lists.id, id));
    updateTag(tags.list(id));
    updateTag(tags.lists);
    return { ok: true, liked, count: n };
  }

  const where = and(eq(reviewLikes.userId, viewer.id), eq(reviewLikes.reviewKind, kind), eq(reviewLikes.reviewId, id));
  const removed = await db.delete(reviewLikes).where(where).returning({ id: reviewLikes.reviewId });
  liked = removed.length === 0;
  if (liked) await db.insert(reviewLikes).values({ userId: viewer.id, reviewKind: kind, reviewId: id }).onConflictDoNothing();

  // Recontagem (em vez de +1/-1) mantém o contador correto mesmo com cliques concorrentes.
  const [{ n }] = await db
    .select({ n: count() })
    .from(reviewLikes)
    .where(and(eq(reviewLikes.reviewKind, kind), eq(reviewLikes.reviewId, id)));
  if (kind === "critic") await db.update(criticReviews).set({ likeCount: n }).where(eq(criticReviews.id, id));
  else await db.update(userReviews).set({ likeCount: n }).where(eq(userReviews.id, id));
  await invalidateReview(kind, id);
  return { ok: true, liked, count: n };
}

/** Quais destes itens o visitante já curtiu (para pintar os corações em páginas cacheadas). */
export async function getMyLikes(kind: LikeKind, ids: string[]): Promise<string[]> {
  const viewer = await me();
  const valid = ids.filter((id) => z.uuid().safeParse(id).success).slice(0, 200);
  if (!viewer || !valid.length) return [];
  if (kind === "list") {
    const rows = await db
      .select({ id: listLikes.listId })
      .from(listLikes)
      .where(and(eq(listLikes.userId, viewer.id), inArray(listLikes.listId, valid)));
    return rows.map((r) => r.id);
  }
  const rows = await db
    .select({ id: reviewLikes.reviewId })
    .from(reviewLikes)
    .where(and(eq(reviewLikes.userId, viewer.id), eq(reviewLikes.reviewKind, kind), inArray(reviewLikes.reviewId, valid)));
  return rows.map((r) => r.id);
}

/* ───────────────────────── Comentários ───────────────────────── */

export type CommentRow = {
  id: string;
  body: string;
  createdAt: Date;
  author: { id: string; name: string; handle: string | null; role: string };
};

async function syncCommentCount(kind: CommentKind, reviewId: string) {
  const [{ n }] = await db
    .select({ n: count() })
    .from(comments)
    .where(and(eq(comments.reviewKind, kind), eq(comments.reviewId, reviewId), eq(comments.visibility, "visible")));
  if (kind === "critic") await db.update(criticReviews).set({ commentCount: n }).where(eq(criticReviews.id, reviewId));
  else await db.update(userReviews).set({ commentCount: n }).where(eq(userReviews.id, reviewId));
}

/** Comentários visíveis de uma review, mais antigos primeiro. Carregados sob demanda ao abrir a conversa. */
export async function listComments(kind: CommentKind, reviewId: string): Promise<{ viewerId: string | null; rows: CommentRow[] }> {
  const parsed = z.object({ kind: z.enum(commentKinds), id: z.uuid() }).safeParse({ kind, id: reviewId });
  if (!parsed.success) return { viewerId: null, rows: [] };
  const [viewer, rows] = await Promise.all([
    me(),
    db
      .select({
        id: comments.id,
        body: comments.body,
        createdAt: comments.createdAt,
        author: { id: user.id, name: user.name, handle: user.handle, role: user.role },
      })
      .from(comments)
      .innerJoin(user, eq(user.id, comments.userId))
      .where(and(eq(comments.reviewKind, kind), eq(comments.reviewId, reviewId), eq(comments.visibility, "visible")))
      .orderBy(asc(comments.createdAt))
      .limit(200),
  ]);
  return { viewerId: viewer?.id ?? null, rows };
}

export async function addComment(kind: CommentKind, reviewId: string, body: string): Promise<{ ok: true; comment: CommentRow } | Fail> {
  const viewer = await me();
  if (!viewer) return { ok: false, error: "auth" };
  const parsed = z
    .object({ kind: z.enum(commentKinds), id: z.uuid(), body: z.string().trim().min(1).max(COMMENT_MAX_CHARS) })
    .safeParse({ kind, id: reviewId, body });
  if (!parsed.success) return { ok: false, error: "invalid" };
  if (!(await likeTarget(kind, reviewId))) return { ok: false, error: "not_found" };

  const [{ recent }] = await db
    .select({ recent: count() })
    .from(comments)
    .where(and(eq(comments.userId, viewer.id), gte(comments.createdAt, minutesAgo(10))));
  if (recent >= 20) return { ok: false, error: "rate_limited" };

  const handle = await ensureHandle(viewer.id);
  const [row] = await db
    .insert(comments)
    .values({ reviewKind: kind, reviewId, userId: viewer.id, body: parsed.data.body })
    .returning({ id: comments.id, body: comments.body, createdAt: comments.createdAt });
  await syncCommentCount(kind, reviewId);
  await invalidateReview(kind, reviewId);

  return {
    ok: true,
    comment: { ...row, author: { id: viewer.id, name: viewer.name, handle, role: viewer.role ?? "user" } },
  };
}

export async function deleteComment(id: string): Promise<{ ok: true } | Fail> {
  const viewer = await me();
  if (!viewer) return { ok: false, error: "auth" };
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "invalid" };
  const [deleted] = await db
    .delete(comments)
    .where(and(eq(comments.id, id), eq(comments.userId, viewer.id)))
    .returning({ kind: comments.reviewKind, reviewId: comments.reviewId });
  if (!deleted) return { ok: false, error: "not_found" };
  await syncCommentCount(deleted.kind, deleted.reviewId);
  await invalidateReview(deleted.kind, deleted.reviewId);
  return { ok: true };
}

export async function reportComment(id: string, reason: string): Promise<{ ok: true } | Fail> {
  const viewer = await me();
  if (!viewer) return { ok: false, error: "auth" };
  const parsed = z.object({ id: z.uuid(), reason: z.enum(reportReasons) }).safeParse({ id, reason });
  if (!parsed.success) return { ok: false, error: "invalid" };

  const [c] = await db
    .select({ userId: comments.userId, kind: comments.reviewKind, reviewId: comments.reviewId })
    .from(comments)
    .where(eq(comments.id, id))
    .limit(1);
  if (!c) return { ok: false, error: "not_found" };
  if (c.userId === viewer.id) return { ok: false, error: "own" };

  await db
    .insert(reports)
    .values({ target: "comment", targetId: id, reporterId: viewer.id, reason: parsed.data.reason })
    .onConflictDoNothing();
  const [{ open }] = await db
    .select({ open: count() })
    .from(reports)
    .where(and(eq(reports.target, "comment"), eq(reports.targetId, id), eq(reports.status, "open")));
  if (open >= AUTO_HIDE_REPORTS) {
    await db.update(comments).set({ visibility: "hidden" }).where(eq(comments.id, id));
    await syncCommentCount(c.kind, c.reviewId);
    await invalidateReview(c.kind, c.reviewId);
  }
  return { ok: true };
}

/* ───────────────────────── Status de jogo ───────────────────────── */

export async function setPlayStatus(gameId: string, status: string | null): Promise<{ ok: true } | Fail> {
  const viewer = await me();
  if (!viewer) return { ok: false, error: "auth" };
  const parsed = z.object({ gameId: z.uuid(), status: z.enum(playStatuses).nullable() }).safeParse({ gameId, status });
  if (!parsed.success) return { ok: false, error: "invalid" };

  if (parsed.data.status === null) {
    await db.delete(gameStatuses).where(and(eq(gameStatuses.userId, viewer.id), eq(gameStatuses.gameId, gameId)));
  } else {
    await ensureHandle(viewer.id);
    await db
      .insert(gameStatuses)
      .values({ userId: viewer.id, gameId, status: parsed.data.status })
      .onConflictDoUpdate({ target: [gameStatuses.userId, gameStatuses.gameId], set: { status: parsed.data.status } });
  }
  updateTag(tags.user(viewer.id));
  updateTag(tags.gameReviews(gameId)); // etiqueta de status ao lado das reviews
  return { ok: true };
}

/* ───────────────────────── Seguir ───────────────────────── */

export async function toggleFollow(targetId: string): Promise<{ ok: true; following: boolean; followers: number } | Fail> {
  const viewer = await me();
  if (!viewer) return { ok: false, error: "auth" };
  if (typeof targetId !== "string" || targetId.length > 64) return { ok: false, error: "invalid" };
  if (targetId === viewer.id) return { ok: false, error: "own" };
  const [target] = await db.select({ id: user.id }).from(user).where(eq(user.id, targetId)).limit(1);
  if (!target) return { ok: false, error: "not_found" };

  const where = and(eq(follows.followerId, viewer.id), eq(follows.followingId, targetId));
  const removed = await db.delete(follows).where(where).returning({ id: follows.followingId });
  const following = removed.length === 0;
  if (following) {
    await ensureHandle(viewer.id);
    await db.insert(follows).values({ followerId: viewer.id, followingId: targetId }).onConflictDoNothing();
  }
  const [{ n }] = await db.select({ n: count() }).from(follows).where(eq(follows.followingId, targetId));
  updateTag(tags.user(targetId));
  updateTag(tags.user(viewer.id));
  return { ok: true, following, followers: n };
}

/* ───────────────────────── Listas ───────────────────────── */

async function ownList(listId: string, userId: string) {
  if (!z.uuid().safeParse(listId).success) return null;
  const [l] = await db
    .select({ id: lists.id, slug: lists.slug })
    .from(lists)
    .where(and(eq(lists.id, listId), eq(lists.userId, userId)))
    .limit(1);
  return l ?? null;
}

async function touchList(listId: string, userId: string) {
  await db.update(lists).set({ updatedAt: new Date() }).where(eq(lists.id, listId));
  updateTag(tags.list(listId));
  updateTag(tags.user(userId));
  updateTag(tags.lists);
}

export type MyListOption = { id: string; title: string; contains: boolean; full: boolean };

/** Listas do visitante para o menu "Adicionar à lista" (com marcação de quais já contêm o jogo). */
export async function getMyLists(gameId: string): Promise<{ ok: true; lists: MyListOption[] } | Fail> {
  const viewer = await me();
  if (!viewer) return { ok: false, error: "auth" };
  if (!z.uuid().safeParse(gameId).success) return { ok: false, error: "invalid" };
  const rows = await db
    .select({
      id: lists.id,
      title: lists.title,
      contains: sql<boolean>`exists(select 1 from ${listItems} li where li.list_id = ${sql.raw(`"lists"."id"`)} and li.game_id = ${gameId})`,
      size: sql<number>`(select count(*)::int from ${listItems} li where li.list_id = ${sql.raw(`"lists"."id"`)})`,
    })
    .from(lists)
    .where(eq(lists.userId, viewer.id))
    .orderBy(desc(lists.updatedAt));
  return { ok: true, lists: rows.map((r) => ({ id: r.id, title: r.title, contains: r.contains, full: r.size >= LIST_MAX_ITEMS })) };
}

const listMeta = z.object({
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500),
  isPublic: z.boolean(),
});

export async function createList(
  input: z.input<typeof listMeta> & { gameId?: string },
): Promise<{ ok: true; id: string; slug: string; handle: string } | Fail> {
  const viewer = await me();
  if (!viewer) return { ok: false, error: "auth" };
  const parsed = listMeta.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const [{ recent }] = await db
    .select({ recent: count() })
    .from(lists)
    .where(and(eq(lists.userId, viewer.id), gte(lists.createdAt, minutesAgo(60))));
  if (recent >= 20) return { ok: false, error: "rate_limited" };

  const handle = await ensureHandle(viewer.id);
  const base = slugify(parsed.data.title) || "lista";
  let slug = base;
  for (let i = 2; ; i++) {
    const [taken] = await db
      .select({ id: lists.id })
      .from(lists)
      .where(and(eq(lists.userId, viewer.id), eq(lists.slug, slug)))
      .limit(1);
    if (!taken) break;
    slug = `${base}-${i}`;
  }

  const [list] = await db
    .insert(lists)
    .values({ userId: viewer.id, slug, title: parsed.data.title, description: parsed.data.description || null, isPublic: parsed.data.isPublic })
    .returning({ id: lists.id });
  if (input.gameId && z.uuid().safeParse(input.gameId).success) {
    await db.insert(listItems).values({ listId: list.id, gameId: input.gameId, position: 1 }).onConflictDoNothing();
  }
  await touchList(list.id, viewer.id);
  return { ok: true, id: list.id, slug, handle };
}

export async function updateList(listId: string, input: z.input<typeof listMeta>): Promise<{ ok: true } | Fail> {
  const viewer = await me();
  if (!viewer) return { ok: false, error: "auth" };
  const list = await ownList(listId, viewer.id);
  if (!list) return { ok: false, error: "not_found" };
  const parsed = listMeta.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  await db
    .update(lists)
    .set({ title: parsed.data.title, description: parsed.data.description || null, isPublic: parsed.data.isPublic })
    .where(eq(lists.id, listId));
  await touchList(listId, viewer.id);
  return { ok: true };
}

export async function deleteList(listId: string): Promise<{ ok: true; handle: string } | Fail> {
  const viewer = await me();
  if (!viewer) return { ok: false, error: "auth" };
  const list = await ownList(listId, viewer.id);
  if (!list) return { ok: false, error: "not_found" };
  await db.delete(lists).where(eq(lists.id, listId));
  await touchList(listId, viewer.id);
  return { ok: true, handle: await ensureHandle(viewer.id) };
}

export async function addGameToList(listId: string, gameId: string): Promise<{ ok: true } | Fail> {
  const viewer = await me();
  if (!viewer) return { ok: false, error: "auth" };
  const list = await ownList(listId, viewer.id);
  if (!list || !z.uuid().safeParse(gameId).success) return { ok: false, error: "invalid" };
  const [game] = await db.select({ id: games.id }).from(games).where(eq(games.id, gameId)).limit(1);
  if (!game) return { ok: false, error: "not_found" };

  const [{ n, last }] = await db
    .select({ n: count(), last: max(listItems.position) })
    .from(listItems)
    .where(eq(listItems.listId, listId));
  if (n >= LIST_MAX_ITEMS) return { ok: false, error: "full" };
  await db
    .insert(listItems)
    .values({ listId, gameId, position: (last ?? 0) + 1 })
    .onConflictDoNothing();
  await touchList(listId, viewer.id);
  return { ok: true };
}

export async function removeGameFromList(listId: string, gameId: string): Promise<{ ok: true } | Fail> {
  const viewer = await me();
  if (!viewer) return { ok: false, error: "auth" };
  if (!(await ownList(listId, viewer.id)) || !z.uuid().safeParse(gameId).success) return { ok: false, error: "invalid" };
  await db.delete(listItems).where(and(eq(listItems.listId, listId), eq(listItems.gameId, gameId)));
  await touchList(listId, viewer.id);
  return { ok: true };
}

/** Troca a posição do item com o vizinho de cima (-1) ou de baixo (+1). */
export async function moveListItem(listId: string, gameId: string, direction: -1 | 1): Promise<{ ok: true } | Fail> {
  const viewer = await me();
  if (!viewer) return { ok: false, error: "auth" };
  if (!(await ownList(listId, viewer.id)) || !z.uuid().safeParse(gameId).success || ![-1, 1].includes(direction)) {
    return { ok: false, error: "invalid" };
  }

  await db.transaction(async (tx) => {
    const [item] = await tx
      .select({ position: listItems.position })
      .from(listItems)
      .where(and(eq(listItems.listId, listId), eq(listItems.gameId, gameId)))
      .limit(1);
    if (!item) return;
    const [neighbor] = await tx
      .select({ gameId: listItems.gameId, position: listItems.position })
      .from(listItems)
      .where(and(eq(listItems.listId, listId), direction < 0 ? lt(listItems.position, item.position) : gt(listItems.position, item.position)))
      .orderBy(direction < 0 ? desc(listItems.position) : asc(listItems.position))
      .limit(1);
    if (!neighbor) return;
    await tx.update(listItems).set({ position: neighbor.position }).where(and(eq(listItems.listId, listId), eq(listItems.gameId, gameId)));
    await tx.update(listItems).set({ position: item.position }).where(and(eq(listItems.listId, listId), eq(listItems.gameId, neighbor.gameId)));
  });
  await touchList(listId, viewer.id);
  return { ok: true };
}

export async function setListItemNote(listId: string, gameId: string, note: string): Promise<{ ok: true } | Fail> {
  const viewer = await me();
  if (!viewer) return { ok: false, error: "auth" };
  if (!(await ownList(listId, viewer.id)) || !z.uuid().safeParse(gameId).success) return { ok: false, error: "invalid" };
  const text = z.string().trim().max(280).safeParse(note);
  if (!text.success) return { ok: false, error: "invalid" };
  await db
    .update(listItems)
    .set({ note: text.data || null })
    .where(and(eq(listItems.listId, listId), eq(listItems.gameId, gameId)));
  await touchList(listId, viewer.id);
  return { ok: true };
}

/* ───────────────────────── Conta ───────────────────────── */

export async function updateProfile(input: { name: string; handle: string; bio: string }): Promise<{ ok: true; handle: string } | Fail> {
  const viewer = await me();
  if (!viewer) return { ok: false, error: "auth" };
  const parsed = z
    .object({
      name: z.string().trim().min(1).max(60),
      handle: z.string().trim().toLowerCase().regex(HANDLE_PATTERN),
      bio: z.string().trim().max(280),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const [taken] = await db.select({ id: user.id }).from(user).where(eq(user.handle, parsed.data.handle)).limit(1);
  if (taken && taken.id !== viewer.id) return { ok: false, error: "taken" };

  await db
    .update(user)
    .set({ name: parsed.data.name, handle: parsed.data.handle, bio: parsed.data.bio || null })
    .where(eq(user.id, viewer.id));
  updateTag(tags.user(viewer.id));
  updateTag(tags.games); // nome aparece em listas de críticos/reviews
  return { ok: true, handle: parsed.data.handle };
}
