import "server-only";
import { and, asc, count, desc, eq, exists, gte, isNotNull, lt, sql, type SQL } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { gameGenres, gamePlatforms, gameStudios, games, genres, platforms, studios } from "@/db/schema";
import { tags } from "./games";

export const catalogSorts = ["nota", "publico", "lancamento"] as const;
export type CatalogSort = (typeof catalogSorts)[number];

export type CatalogFilters = {
  genre?: string;
  platform?: string;
  studio?: string;
  /** "2026" ou "2026-03" */
  release?: string;
  sort: CatalogSort;
};

export const CATALOG_PAGE_SIZE = 24;

/** "2026" → [2026-01-01, 2027-01-01); "2026-03" → [2026-03-01, 2026-04-01). */
function releaseRange(release: string): [string, string] | null {
  const m = /^(\d{4})(?:-(\d{2}))?$/.exec(release);
  if (!m) return null;
  const year = Number(m[1]);
  if (!m[2]) return [`${year}-01-01`, `${year + 1}-01-01`];
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  const next = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;
  return [`${year}-${m[2]}-01`, next];
}

function whereFor(f: CatalogFilters): SQL | undefined {
  const conds: Array<SQL | undefined> = [];
  if (f.genre) {
    conds.push(
      exists(
        db
          .select({ x: sql`1` })
          .from(gameGenres)
          .innerJoin(genres, eq(genres.id, gameGenres.genreId))
          .where(and(eq(gameGenres.gameId, games.id), eq(genres.slug, f.genre))),
      ),
    );
  }
  if (f.platform) {
    conds.push(
      exists(
        db
          .select({ x: sql`1` })
          .from(gamePlatforms)
          .innerJoin(platforms, eq(platforms.id, gamePlatforms.platformId))
          .where(and(eq(gamePlatforms.gameId, games.id), eq(platforms.slug, f.platform))),
      ),
    );
  }
  if (f.studio) {
    conds.push(
      exists(
        db
          .select({ x: sql`1` })
          .from(gameStudios)
          .innerJoin(studios, eq(studios.id, gameStudios.studioId))
          .where(and(eq(gameStudios.gameId, games.id), eq(studios.slug, f.studio))),
      ),
    );
  }
  const range = f.release ? releaseRange(f.release) : null;
  if (range) conds.push(gte(games.releaseDate, range[0]), lt(games.releaseDate, range[1]));
  return and(...conds);
}

const orderFor = (sort: CatalogSort) =>
  sort === "publico"
    ? [sql`${games.userScore} desc nulls last`, desc(games.userCount)]
    : sort === "lancamento"
      ? [sql`${games.releaseDate} desc nulls last`]
      : [sql`${games.criticScore} desc nulls last`, desc(games.criticCount)];

export async function listCatalog(filters: CatalogFilters, limit: number) {
  "use cache";
  cacheLife("hours");
  cacheTag(tags.games);

  const where = whereFor(filters);
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        slug: games.slug,
        title: games.title,
        coverUrl: games.coverUrl,
        releaseDate: games.releaseDate,
        criticScore: games.criticScore,
        userScore: games.userScore,
      })
      .from(games)
      .where(where)
      .orderBy(...orderFor(filters.sort), asc(games.title))
      .limit(limit),
    db.select({ total: count() }).from(games).where(where),
  ]);
  return { rows, total };
}

/** Opções de filtro: só o que tem jogo no catálogo, mais usados primeiro. */
export async function getCatalogFacets() {
  "use cache";
  cacheLife("hours");
  cacheTag(tags.games);

  const [genreRows, platformRows, years] = await Promise.all([
    db
      .select({ slug: genres.slug, namePt: genres.namePt, nameEn: genres.nameEn, n: count() })
      .from(genres)
      .innerJoin(gameGenres, eq(gameGenres.genreId, genres.id))
      .groupBy(genres.id)
      .orderBy(desc(count()), asc(genres.namePt))
      .limit(12),
    db
      .select({ slug: platforms.slug, name: platforms.name, shortName: platforms.shortName, n: count() })
      .from(platforms)
      .innerJoin(gamePlatforms, eq(gamePlatforms.platformId, platforms.id))
      .groupBy(platforms.id)
      .orderBy(desc(count()), asc(platforms.name))
      .limit(8),
    db
      .select({ year: sql<string>`extract(year from ${games.releaseDate})::int::text` })
      .from(games)
      .where(isNotNull(games.releaseDate))
      .groupBy(sql`1`)
      .orderBy(desc(sql`1`))
      .limit(6),
  ]);
  return { genres: genreRows, platforms: platformRows, years: years.map((y) => y.year) };
}

/** Rótulos para o título da listagem quando há filtro ativo. */
export async function getFilterLabels(f: { genre?: string; platform?: string; studio?: string }) {
  "use cache";
  cacheLife("days");
  cacheTag(tags.games);

  const [genre, platform, studio] = await Promise.all([
    f.genre ? db.select({ pt: genres.namePt, en: genres.nameEn }).from(genres).where(eq(genres.slug, f.genre)).limit(1) : [],
    f.platform ? db.select({ name: platforms.name }).from(platforms).where(eq(platforms.slug, f.platform)).limit(1) : [],
    f.studio ? db.select({ name: studios.name }).from(studios).where(eq(studios.slug, f.studio)).limit(1) : [],
  ]);
  return { genre: genre[0] ?? null, platform: platform[0]?.name ?? null, studio: studio[0]?.name ?? null };
}
