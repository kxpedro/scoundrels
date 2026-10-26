import "server-only";
import { and, desc, eq, gte, isNotNull, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { criticReviews, games, user } from "@/db/schema";
import { tags } from "./games";

const reviewCard = {
  slug: criticReviews.slug,
  title: criticReviews.title,
  excerpt: criticReviews.excerpt,
  score: criticReviews.score,
  publishedAt: criticReviews.publishedAt,
  game: { slug: games.slug, title: games.title, coverUrl: games.coverUrl },
  author: { name: user.name, handle: user.handle, role: user.role, title: user.title },
};

/** Críticas publicadas, mais recentes primeiro (home e /reviews). */
export async function listLatestCriticReviews(limit: number) {
  "use cache";
  cacheLife("hours");
  cacheTag(tags.games);

  return db
    .select(reviewCard)
    .from(criticReviews)
    .innerJoin(games, eq(games.id, criticReviews.gameId))
    .innerJoin(user, eq(user.id, criticReviews.authorId))
    .where(eq(criticReviews.status, "published"))
    .orderBy(desc(criticReviews.publishedAt))
    .limit(limit);
}

export type ReviewCard = Awaited<ReturnType<typeof listLatestCriticReviews>>[number];

export type TopKind = "ano" | "todos" | "publico";

/** Ranking da home: Scoundrel do ano, Scoundrel geral ou público (mínimo de notas para entrar). */
export async function listTopGames(kind: TopKind, limit = 5) {
  "use cache";
  cacheLife("hours");
  cacheTag(tags.games);

  const yearStart = `${new Date().getFullYear()}-01-01`;
  const base = db
    .select({
      slug: games.slug,
      title: games.title,
      criticScore: games.criticScore,
      userScore: games.userScore,
    })
    .from(games);

  if (kind === "publico") {
    return base
      .where(and(isNotNull(games.userScore), gte(games.userCount, 2)))
      .orderBy(desc(games.userScore), desc(games.userCount))
      .limit(limit);
  }
  return base
    .where(and(isNotNull(games.criticScore), kind === "ano" ? gte(games.releaseDate, yearStart) : undefined))
    .orderBy(desc(games.criticScore), desc(games.criticCount), sql`${games.releaseDate} desc nulls last`)
    .limit(limit);
}
