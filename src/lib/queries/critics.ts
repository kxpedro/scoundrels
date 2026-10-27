import "server-only";
import { and, avg, count, desc, eq, ne, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { criticReviews, games, user } from "@/db/schema";
import { activeGame, tags } from "./games";

/** Publicada e de jogo não arquivado (contagens, média e histograma ignoram jogos arquivados). */
const published = and(
  eq(criticReviews.status, "published"),
  sql`exists(select 1 from ${games} g where g.id = ${sql.raw(`"critic_reviews"."game_id"`)} and g.archived_at is null)`,
);

/** Equipe pública: quem tem papel de redação, com volume e média das críticas publicadas. */
export async function listCritics() {
  "use cache";
  cacheLife("hours");
  cacheTag(tags.games);

  return db
    .select({
      name: user.name,
      handle: user.handle,
      role: user.role,
      title: user.title,
      reviews: count(criticReviews.id),
      average: sql<number | null>`round(avg(${criticReviews.score})::numeric, 1)::real`,
    })
    .from(user)
    .leftJoin(criticReviews, and(eq(criticReviews.authorId, user.id), published))
    .where(and(ne(user.role, "user"), sql`${user.handle} is not null`))
    .groupBy(user.id)
    .orderBy(desc(count(criticReviews.id)), user.name);
}

export async function getCriticProfile(handle: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(tags.games);

  const [critic] = await db
    .select({ id: user.id, name: user.name, handle: user.handle, role: user.role, title: user.title, bio: user.bio })
    .from(user)
    .where(and(eq(user.handle, handle), ne(user.role, "user")))
    .limit(1);
  if (!critic) return null;

  const mine = and(eq(criticReviews.authorId, critic.id), published);
  const [[stats], buckets, reviews] = await Promise.all([
    db.select({ total: count(), average: avg(criticReviews.score) }).from(criticReviews).where(mine),
    // Distribuição em 10 faixas: [0,1), [1,2) … [9,10] (o 10 entra na última)
    db
      .select({ bucket: sql<number>`least(floor(${criticReviews.score}), 9)::int`, n: count() })
      .from(criticReviews)
      .where(mine)
      .groupBy(sql`1`),
    db
      .select({
        slug: criticReviews.slug,
        title: criticReviews.title,
        score: criticReviews.score,
        publishedAt: criticReviews.publishedAt,
        game: { slug: games.slug, title: games.title },
      })
      .from(criticReviews)
      .innerJoin(games, and(eq(games.id, criticReviews.gameId), activeGame))
      .where(mine)
      .orderBy(desc(criticReviews.publishedAt))
      .limit(100),
  ]);

  const distribution = Array.from({ length: 10 }, (_, i) => buckets.find((b) => b.bucket === i)?.n ?? 0);
  return {
    critic,
    total: stats.total,
    average: stats.average === null ? null : Math.round(Number(stats.average) * 10) / 10,
    distribution,
    reviews,
  };
}
