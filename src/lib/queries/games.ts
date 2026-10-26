import "server-only";
import { and, desc, eq, inArray, isNotNull, ne, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import {
  criticReviews,
  gameGenres,
  gamePlatforms,
  gameStatuses,
  gameStudios,
  games,
  genres,
  platforms,
  studios,
  user,
  userReviews,
} from "@/db/schema";

export const tags = {
  game: (slug: string) => `game:${slug}`,
  games: "games",
};

export async function listRecentGames(limit = 12) {
  "use cache";
  cacheLife("hours");
  cacheTag(tags.games);

  return db
    .select({
      slug: games.slug,
      title: games.title,
      coverUrl: games.coverUrl,
      releaseDate: games.releaseDate,
      criticScore: games.criticScore,
      userScore: games.userScore,
    })
    .from(games)
    .where(isNotNull(games.criticScore))
    .orderBy(desc(games.releaseDate))
    .limit(limit);
}

export type GameDetail = NonNullable<Awaited<ReturnType<typeof getGameBySlug>>>;

/** Página do jogo: dados públicos, cacheados e invalidados por tag ao publicar review. */
export async function getGameBySlug(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(tags.game(slug));

  const [game] = await db.select().from(games).where(eq(games.slug, slug)).limit(1);
  if (!game) return null;

  const [genreRows, platformRows, studioRows] = await Promise.all([
    db
      .select({ slug: genres.slug, namePt: genres.namePt, nameEn: genres.nameEn })
      .from(gameGenres)
      .innerJoin(genres, eq(genres.id, gameGenres.genreId))
      .where(eq(gameGenres.gameId, game.id)),
    db
      .select({ slug: platforms.slug, name: platforms.name, shortName: platforms.shortName })
      .from(gamePlatforms)
      .innerJoin(platforms, eq(platforms.id, gamePlatforms.platformId))
      .where(eq(gamePlatforms.gameId, game.id)),
    db
      .select({ slug: studios.slug, name: studios.name, role: gameStudios.role })
      .from(gameStudios)
      .innerJoin(studios, eq(studios.id, gameStudios.studioId))
      .where(eq(gameStudios.gameId, game.id)),
  ]);

  return { ...game, genres: genreRows, platforms: platformRows, studios: studioRows };
}

export async function getCriticReviews(gameId: string, limit = 4) {
  "use cache";
  cacheLife("hours");

  return db
    .select({
      slug: criticReviews.slug,
      title: criticReviews.title,
      excerpt: criticReviews.excerpt,
      score: criticReviews.score,
      publishedAt: criticReviews.publishedAt,
      author: { name: user.name, handle: user.handle, role: user.role, title: user.title },
    })
    .from(criticReviews)
    .innerJoin(user, eq(user.id, criticReviews.authorId))
    .where(and(eq(criticReviews.gameId, gameId), eq(criticReviews.status, "published")))
    .orderBy(desc(criticReviews.score))
    .limit(limit);
}

export async function getUserReviews(gameId: string, limit = 4) {
  "use cache";
  cacheLife("minutes");

  return db
    .select({
      id: userReviews.id,
      score: userReviews.score,
      body: userReviews.body,
      likeCount: userReviews.likeCount,
      commentCount: userReviews.commentCount,
      createdAt: userReviews.createdAt,
      author: { name: user.name, handle: user.handle },
      playStatus: gameStatuses.status,
    })
    .from(userReviews)
    .innerJoin(user, eq(user.id, userReviews.userId))
    .leftJoin(gameStatuses, and(eq(gameStatuses.userId, userReviews.userId), eq(gameStatuses.gameId, userReviews.gameId)))
    .where(and(eq(userReviews.gameId, gameId), eq(userReviews.visibility, "visible")))
    .orderBy(desc(userReviews.likeCount))
    .limit(limit);
}

/** Jogos que compartilham gênero, ordenados pela quantidade de gêneros em comum. */
export async function getSimilarGames(gameId: string, limit = 4) {
  "use cache";
  cacheLife("days");

  const ownGenres = db.select({ id: gameGenres.genreId }).from(gameGenres).where(eq(gameGenres.gameId, gameId));

  return db
    .select({
      slug: games.slug,
      title: games.title,
      coverUrl: games.coverUrl,
      criticScore: games.criticScore,
      userScore: games.userScore,
    })
    .from(gameGenres)
    .innerJoin(games, eq(games.id, gameGenres.gameId))
    .where(and(inArray(gameGenres.genreId, ownGenres), ne(games.id, gameId)))
    .groupBy(games.id)
    .orderBy(desc(sql`count(*)`), desc(games.criticScore))
    .limit(limit);
}
