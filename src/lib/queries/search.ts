import "server-only";
import { and, desc, eq, ilike, ne, or, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { criticReviews, games, user } from "@/db/schema";
import { tags } from "./games";

const like = (term: string) => `%${term.replace(/[%_\\]/g, "\\$&")}%`;

/** Busca simples por título/nome (ILIKE). Suficiente para o volume do MVP. */
export async function searchSite(term: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(tags.games);

  const q = like(term);
  const [gameRows, criticRows, reviewRows] = await Promise.all([
    db
      .select({
        slug: games.slug,
        title: games.title,
        coverUrl: games.coverUrl,
        criticScore: games.criticScore,
        userScore: games.userScore,
      })
      .from(games)
      .where(ilike(games.title, q))
      .orderBy(sql`${games.criticCount} + ${games.userCount} desc`)
      .limit(12),
    db
      .select({ name: user.name, handle: user.handle, role: user.role, title: user.title })
      .from(user)
      .where(and(ne(user.role, "user"), sql`${user.handle} is not null`, or(ilike(user.name, q), ilike(user.handle, q))))
      .limit(6),
    db
      .select({
        slug: criticReviews.slug,
        title: criticReviews.title,
        score: criticReviews.score,
        game: games.title,
        author: user.name,
      })
      .from(criticReviews)
      .innerJoin(games, eq(games.id, criticReviews.gameId))
      .innerJoin(user, eq(user.id, criticReviews.authorId))
      .where(and(eq(criticReviews.status, "published"), or(ilike(criticReviews.title, q), ilike(games.title, q))))
      .orderBy(desc(criticReviews.publishedAt))
      .limit(8),
  ]);
  return { games: gameRows, critics: criticRows, reviews: reviewRows };
}
