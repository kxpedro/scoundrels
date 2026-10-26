import "server-only";
import { and, asc, count, desc, eq, gte, inArray, ne, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { criticReviews, follows, gameStatuses, games, listItems, lists, user, userReviews } from "@/db/schema";
import type { PlayStatus } from "@/lib/social/constants";
import { tags } from "./games";

/**
 * Referências qualificadas para subconsultas correlacionadas: sem join, o Drizzle escreve a coluna sem tabela
 * ("id"), que dentro da subconsulta acaba resolvendo para a tabela interna.
 */
const LISTS_ID = sql.raw(`"lists"."id"`);
const USER_ID = sql.raw(`"user"."id"`);

/* ───────────────────────── Perfil ───────────────────────── */

export async function getUserProfile(handle: string) {
  "use cache";
  cacheLife("minutes");

  const [u] = await db
    .select({ id: user.id, name: user.name, handle: user.handle, bio: user.bio, role: user.role, title: user.title, createdAt: user.createdAt })
    .from(user)
    .where(eq(user.handle, handle))
    .limit(1);
  if (!u) return null;
  cacheTag(tags.user(u.id));

  const [[followers], [following], [reviews], statusRows, [listCount]] = await Promise.all([
    db.select({ n: count() }).from(follows).where(eq(follows.followingId, u.id)),
    db.select({ n: count() }).from(follows).where(eq(follows.followerId, u.id)),
    db.select({ n: count() }).from(userReviews).where(and(eq(userReviews.userId, u.id), eq(userReviews.visibility, "visible"))),
    db.select({ status: gameStatuses.status, n: count() }).from(gameStatuses).where(eq(gameStatuses.userId, u.id)).groupBy(gameStatuses.status),
    db.select({ n: count() }).from(lists).where(and(eq(lists.userId, u.id), eq(lists.isPublic, true))),
  ]);
  const byStatus = (s: PlayStatus) => statusRows.find((r) => r.status === s)?.n ?? 0;

  return {
    user: u,
    followers: followers.n,
    following: following.n,
    reviews: reviews.n,
    lists: listCount.n,
    statuses: { playing: byStatus("playing"), finished: byStatus("finished"), wishlist: byStatus("wishlist"), dropped: byStatus("dropped") },
  };
}

const gameTile = {
  slug: games.slug,
  title: games.title,
  coverUrl: games.coverUrl,
  criticScore: games.criticScore,
  userScore: games.userScore,
};

export async function listUserReviews(userId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(tags.user(userId));

  return db
    .select({ id: userReviews.id, score: userReviews.score, body: userReviews.body, createdAt: userReviews.createdAt, game: gameTile })
    .from(userReviews)
    .innerJoin(games, eq(games.id, userReviews.gameId))
    .where(and(eq(userReviews.userId, userId), eq(userReviews.visibility, "visible")))
    .orderBy(desc(userReviews.createdAt))
    .limit(120);
}

export async function listUserGames(userId: string, status: PlayStatus) {
  "use cache";
  cacheLife("minutes");
  cacheTag(tags.user(userId));

  return db
    .select({ ...gameTile, myScore: userReviews.score })
    .from(gameStatuses)
    .innerJoin(games, eq(games.id, gameStatuses.gameId))
    .leftJoin(userReviews, and(eq(userReviews.gameId, gameStatuses.gameId), eq(userReviews.userId, userId)))
    .where(and(eq(gameStatuses.userId, userId), eq(gameStatuses.status, status)))
    .orderBy(desc(gameStatuses.updatedAt))
    .limit(240);
}

/* ───────────────────────── Listas ───────────────────────── */

const listCard = {
  id: lists.id,
  slug: lists.slug,
  title: lists.title,
  description: lists.description,
  isPublic: lists.isPublic,
  likeCount: lists.likeCount,
  updatedAt: lists.updatedAt,
  size: sql<number>`(select count(*)::int from ${listItems} li where li.list_id = ${LISTS_ID})`,
  // Até 4 capas para o mosaico do card
  covers: sql<Array<{ slug: string; title: string; coverUrl: string | null }>>`coalesce((
    select json_agg(json_build_object('slug', g.slug, 'title', g.title, 'coverUrl', g.cover_url) order by li.position)
    from (select * from ${listItems} where list_id = ${LISTS_ID} order by position limit 4) li
    join ${games} g on g.id = li.game_id
  ), '[]'::json)`,
};

export type ListCardData = Awaited<ReturnType<typeof listUserLists>>[number];

export async function listUserLists(userId: string, includePrivate: boolean) {
  "use cache";
  cacheLife("minutes");
  cacheTag(tags.user(userId));

  return db
    .select({ ...listCard, owner: { name: user.name, handle: user.handle } })
    .from(lists)
    .innerJoin(user, eq(user.id, lists.userId))
    .where(and(eq(lists.userId, userId), includePrivate ? undefined : eq(lists.isPublic, true)))
    .orderBy(desc(lists.updatedAt));
}

export async function listPopularLists(limit = 24) {
  "use cache";
  cacheLife("hours");
  cacheTag(tags.lists);

  return db
    .select({ ...listCard, owner: { name: user.name, handle: user.handle } })
    .from(lists)
    .innerJoin(user, eq(user.id, lists.userId))
    .where(and(eq(lists.isPublic, true), sql`exists(select 1 from ${listItems} li where li.list_id = ${LISTS_ID})`))
    .orderBy(desc(lists.likeCount), desc(lists.updatedAt))
    .limit(limit);
}

export async function getList(handle: string, slug: string) {
  "use cache";
  cacheLife("minutes");

  const [row] = await db
    .select({
      id: lists.id,
      slug: lists.slug,
      title: lists.title,
      description: lists.description,
      isPublic: lists.isPublic,
      likeCount: lists.likeCount,
      updatedAt: lists.updatedAt,
      owner: { id: user.id, name: user.name, handle: user.handle },
    })
    .from(lists)
    .innerJoin(user, eq(user.id, lists.userId))
    .where(and(eq(user.handle, handle), eq(lists.slug, slug)))
    .limit(1);
  if (!row) return null;
  cacheTag(tags.list(row.id));
  cacheTag(tags.user(row.owner.id));

  const items = await db
    .select({ gameId: listItems.gameId, position: listItems.position, note: listItems.note, game: gameTile })
    .from(listItems)
    .innerJoin(games, eq(games.id, listItems.gameId))
    .where(eq(listItems.listId, row.id))
    .orderBy(asc(listItems.position));
  return { ...row, items };
}

/* ───────────────────────── Seguir / feed (por visitante, sem cache) ───────────────────────── */

export async function isFollowing(viewerId: string, targetId: string) {
  const [row] = await db
    .select({ x: follows.followerId })
    .from(follows)
    .where(and(eq(follows.followerId, viewerId), eq(follows.followingId, targetId)))
    .limit(1);
  return Boolean(row);
}

export type FeedFilter = "todos" | "criticos" | "jogadores";

export type FeedItem =
  | { kind: "critic"; at: Date; actor: Actor; game: GameRef; slug: string; title: string; score: number | null }
  | { kind: "review"; at: Date; actor: Actor; game: GameRef; body: string | null; score: number }
  | { kind: "status"; at: Date; actor: Actor; game: GameRef; status: PlayStatus }
  | { kind: "list"; at: Date; actor: Actor; slug: string; title: string };
type Actor = { name: string; handle: string | null; role: string };
type GameRef = { slug: string; title: string };

/** Atividade recente de quem o visitante segue (últimos 60 dias), mais recente primeiro. */
export async function getFeed(viewerId: string, filter: FeedFilter, limit = 40): Promise<FeedItem[]> {
  const followed = await db.select({ id: follows.followingId }).from(follows).where(eq(follows.followerId, viewerId));
  if (!followed.length) return [];
  const ids = followed.map((f) => f.id);
  const since = new Date(Date.now() - 60 * 86_400_000);
  const actor = { name: user.name, handle: user.handle, role: user.role };
  const roleFilter = filter === "criticos" ? ne(user.role, "user") : filter === "jogadores" ? eq(user.role, "user") : undefined;

  const [critic, reviews, statuses, newLists] = await Promise.all([
    filter === "jogadores"
      ? []
      : db
          .select({ at: criticReviews.publishedAt, actor, game: { slug: games.slug, title: games.title }, slug: criticReviews.slug, title: criticReviews.title, score: criticReviews.score })
          .from(criticReviews)
          .innerJoin(user, eq(user.id, criticReviews.authorId))
          .innerJoin(games, eq(games.id, criticReviews.gameId))
          .where(and(inArray(criticReviews.authorId, ids), eq(criticReviews.status, "published"), gte(criticReviews.publishedAt, since)))
          .orderBy(desc(criticReviews.publishedAt))
          .limit(limit),
    db
      .select({ at: userReviews.createdAt, actor, game: { slug: games.slug, title: games.title }, body: userReviews.body, score: userReviews.score })
      .from(userReviews)
      .innerJoin(user, eq(user.id, userReviews.userId))
      .innerJoin(games, eq(games.id, userReviews.gameId))
      .where(and(inArray(userReviews.userId, ids), eq(userReviews.visibility, "visible"), gte(userReviews.createdAt, since), roleFilter))
      .orderBy(desc(userReviews.createdAt))
      .limit(limit),
    db
      .select({ at: gameStatuses.updatedAt, actor, game: { slug: games.slug, title: games.title }, status: gameStatuses.status })
      .from(gameStatuses)
      .innerJoin(user, eq(user.id, gameStatuses.userId))
      .innerJoin(games, eq(games.id, gameStatuses.gameId))
      // Só os marcos interessantes: zerou ou começou a jogar
      .where(and(inArray(gameStatuses.userId, ids), inArray(gameStatuses.status, ["finished", "playing"]), gte(gameStatuses.updatedAt, since), roleFilter))
      .orderBy(desc(gameStatuses.updatedAt))
      .limit(limit),
    db
      .select({ at: lists.createdAt, actor, slug: lists.slug, title: lists.title })
      .from(lists)
      .innerJoin(user, eq(user.id, lists.userId))
      .where(and(inArray(lists.userId, ids), eq(lists.isPublic, true), gte(lists.createdAt, since), roleFilter))
      .orderBy(desc(lists.createdAt))
      .limit(limit),
  ]);

  const items: FeedItem[] = [
    ...critic.filter((c) => c.at).map((c) => ({ kind: "critic" as const, ...c, at: c.at! })),
    ...reviews.map((r) => ({ kind: "review" as const, ...r })),
    ...statuses.map((s) => ({ kind: "status" as const, ...s })),
    ...newLists.map((l) => ({ kind: "list" as const, ...l })),
  ];
  return items.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}

/** Sugestões para feed vazio: equipe da redação e jogadores com mais reviews. */
export async function getFollowSuggestions(viewerId: string) {
  const reviewCount = sql<number>`(select count(*)::int from ${userReviews} ur where ur.user_id = ${USER_ID} and ur.visibility = 'visible')`;
  return db
    .select({ id: user.id, name: user.name, handle: user.handle, role: user.role, title: user.title, reviews: reviewCount })
    .from(user)
    .where(
      and(
        ne(user.id, viewerId),
        sql`${user.handle} is not null`,
        sql`not exists(select 1 from ${follows} f where f.follower_id = ${viewerId} and f.following_id = ${USER_ID})`,
      ),
    )
    .orderBy(sql`case when ${user.role} = 'user' then 1 else 0 end`, desc(reviewCount))
    .limit(8);
}
