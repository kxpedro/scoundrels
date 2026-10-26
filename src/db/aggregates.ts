import { sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

type AnyDb = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

/**
 * Recalcula as notas agregadas de um jogo (Scoundrel Score, User Score e distribuição).
 * Chamar sempre que uma crítica for publicada/despublicada ou uma user review mudar.
 */
export async function recomputeGameScores(db: AnyDb, gameId: string) {
  await db.execute(sql`
    update games g set
      critic_score  = c.avg_score,
      critic_count  = c.n,
      user_score    = u.avg_score,
      user_count    = u.n,
      user_positive = u.pos,
      user_mixed    = u.mix,
      user_negative = u.neg,
      updated_at    = now()
    from
      (select round(avg(score)::numeric, 1)::real as avg_score, count(*)::int as n
         from critic_reviews
        where game_id = ${gameId} and status = 'published' and score is not null) c,
      (select round(avg(score)::numeric, 1)::real as avg_score, count(*)::int as n,
              count(*) filter (where score >= 7)::int as pos,
              count(*) filter (where score >= 5 and score < 7)::int as mix,
              count(*) filter (where score < 5)::int as neg
         from user_reviews
        where game_id = ${gameId} and visibility = 'visible') u
    where g.id = ${gameId}
  `);
}
