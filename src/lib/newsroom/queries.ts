import "server-only";
import { aliasedTable, and, count, desc, eq, gte, ilike, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  comments,
  criticReviews,
  gameGenres,
  gamePlatforms,
  gameStudios,
  games,
  genres,
  platforms,
  reports,
  studios,
  user,
  userReviews,
  type CriticReviewStatus,
} from "@/db/schema";
import { hasRole } from "@/lib/session-roles";

/**
 * Consultas da redação: sempre por requisição (sem "use cache"), pois dependem de quem está logado
 * e precisam refletir edições na hora.
 */

type Actor = { id: string; role: string | null | undefined };

/** Editores enxergam tudo; críticos, só o que escreveram. */
const scopeFor = (actor: Actor) => (hasRole(actor.role, "editor") ? undefined : eq(criticReviews.authorId, actor.id));

export async function getDashboardStats(actor: Actor) {
  const scope = scopeFor(actor);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [byStatus, [published]] = await Promise.all([
    db
      .select({ status: criticReviews.status, n: count() })
      .from(criticReviews)
      .where(scope)
      .groupBy(criticReviews.status),
    db
      .select({ n: count() })
      .from(criticReviews)
      .where(and(scope, eq(criticReviews.status, "published"), gte(criticReviews.publishedAt, monthStart))),
  ]);

  const of = (s: CriticReviewStatus) => byStatus.find((r) => r.status === s)?.n ?? 0;
  return {
    draft: of("draft"),
    in_review: of("in_review"),
    changes_requested: of("changes_requested"),
    published_month: published.n,
  };
}

export async function getSidebarCounts(actor: Actor) {
  if (!hasRole(actor.role, "editor")) return { queue: 0, reports: 0 };
  const [[queue], [open]] = await Promise.all([
    db.select({ n: count() }).from(criticReviews).where(eq(criticReviews.status, "in_review")),
    db.select({ n: count() }).from(reports).where(eq(reports.status, "open")),
  ]);
  return { queue: queue.n, reports: open.n };
}

export type NewsroomReviewRow = Awaited<ReturnType<typeof listNewsroomReviews>>[number];

export async function listNewsroomReviews(
  actor: Actor,
  { status, mine = false, limit = 50 }: { status?: CriticReviewStatus[]; mine?: boolean; limit?: number } = {},
) {
  return db
    .select({
      id: criticReviews.id,
      title: criticReviews.title,
      status: criticReviews.status,
      score: criticReviews.score,
      updatedAt: criticReviews.updatedAt,
      game: { title: games.title, slug: games.slug },
      author: { name: user.name, email: user.email },
    })
    .from(criticReviews)
    .innerJoin(games, eq(games.id, criticReviews.gameId))
    .innerJoin(user, eq(user.id, criticReviews.authorId))
    .where(
      and(
        mine ? eq(criticReviews.authorId, actor.id) : scopeFor(actor),
        status ? inArray(criticReviews.status, status) : undefined,
      ),
    )
    .orderBy(desc(criticReviews.updatedAt))
    .limit(limit);
}

export async function getReviewForEdit(id: string) {
  const [row] = await db
    .select({
      review: criticReviews,
      game: { id: games.id, title: games.title, slug: games.slug, releaseDate: games.releaseDate },
      author: { id: user.id, name: user.name, email: user.email, handle: user.handle },
      // Nome de quem pediu ajustes/aprovou
      editorName: sql<string | null>`(select name from "user" where id = ${criticReviews.editorId})`,
    })
    .from(criticReviews)
    .innerJoin(games, eq(games.id, criticReviews.gameId))
    .innerJoin(user, eq(user.id, criticReviews.authorId))
    .where(eq(criticReviews.id, id))
    .limit(1);
  if (!row) return null;

  // Plataformas do jogo; se o jogo não tiver nenhuma, oferece o catálogo inteiro.
  let options = await db
    .select({ id: platforms.id, name: platforms.name, shortName: platforms.shortName })
    .from(gamePlatforms)
    .innerJoin(platforms, eq(platforms.id, gamePlatforms.platformId))
    .where(eq(gamePlatforms.gameId, row.game.id));
  if (!options.length) {
    options = await db.select({ id: platforms.id, name: platforms.name, shortName: platforms.shortName }).from(platforms);
  }

  return { ...row, platformOptions: options };
}

export async function searchCatalog(term: string, limit = 20) {
  const q = term.trim();
  return db
    .select({ id: games.id, slug: games.slug, title: games.title, releaseDate: games.releaseDate, coverUrl: games.coverUrl, igdbId: games.igdbId })
    .from(games)
    .where(q ? ilike(games.title, `%${q.replace(/[%_\\]/g, "\\$&")}%`) : undefined)
    .orderBy(desc(games.createdAt))
    .limit(limit);
}

export async function catalogIgdbIds(ids: number[]): Promise<Set<number>> {
  if (!ids.length) return new Set();
  const rows = await db.select({ igdbId: games.igdbId }).from(games).where(inArray(games.igdbId, ids));
  return new Set(rows.map((r) => r.igdbId!));
}

/** Denúncias abertas agrupadas por alvo: uma linha por review/comentário, com a mais recente e o total. */
export async function listOpenReports() {
  const reporter = aliasedTable(user, "reporter");
  const rows = await db
    .select({
      hidden: sql<boolean>`coalesce(${userReviews.visibility}, ${comments.visibility}) = 'hidden'`,
      id: reports.id,
      target: reports.target,
      targetId: reports.targetId,
      reason: reports.reason,
      createdAt: reports.createdAt,
      reporter: reporter.name,
      // Trecho do conteúdo denunciado, seja review ou comentário
      excerpt: sql<string | null>`coalesce(${userReviews.body}, ${comments.body})`,
      gameTitle: games.title,
    })
    .from(reports)
    .innerJoin(reporter, eq(reporter.id, reports.reporterId))
    .leftJoin(userReviews, and(eq(reports.target, "user_review"), eq(userReviews.id, reports.targetId)))
    .leftJoin(comments, and(eq(reports.target, "comment"), eq(comments.id, reports.targetId)))
    .leftJoin(games, eq(games.id, userReviews.gameId))
    .where(eq(reports.status, "open"))
    .orderBy(desc(reports.createdAt));

  const byTarget = new Map<string, (typeof rows)[number] & { count: number }>();
  for (const row of rows) {
    const key = `${row.target}:${row.targetId}`;
    const seen = byTarget.get(key);
    if (seen) seen.count += 1;
    else byTarget.set(key, { ...row, count: 1 });
  }
  return [...byTarget.values()];
}


export type NewsroomGameRow = Awaited<ReturnType<typeof listNewsroomGames>>[number];

/** Catálogo para a gestão da redação, com contagem de reviews (inclui arquivados quando pedido). */
export async function listNewsroomGames({ archived, term = "", limit = 200 }: { archived: boolean; term?: string; limit?: number }) {
  const q = term.trim();
  return db
    .select({
      id: games.id,
      slug: games.slug,
      title: games.title,
      coverUrl: games.coverUrl,
      releaseDate: games.releaseDate,
      igdbId: games.igdbId,
      archivedAt: games.archivedAt,
      criticReviews: sql<number>`(select count(*)::int from ${criticReviews} cr where cr.game_id = ${sql.raw(`"games"."id"`)})`,
      userReviews: sql<number>`(select count(*)::int from ${userReviews} ur where ur.game_id = ${sql.raw(`"games"."id"`)})`,
    })
    .from(games)
    .where(
      and(
        archived ? isNotNull(games.archivedAt) : isNull(games.archivedAt),
        q ? ilike(games.title, `%${q.replace(/[%_\\]/g, "\\$&")}%`) : undefined,
      ),
    )
    .orderBy(desc(games.updatedAt))
    .limit(limit);
}

export async function countNewsroomGames() {
  const [row] = await db
    .select({
      active: sql<number>`count(*) filter (where ${games.archivedAt} is null)::int`,
      archived: sql<number>`count(*) filter (where ${games.archivedAt} is not null)::int`,
    })
    .from(games);
  return row;
}

/** Jogo para o formulário de edição (inclui arquivados), com a taxonomia vinda do IGDB. */
export async function getGameForEdit(slug: string) {
  const [game] = await db.select().from(games).where(eq(games.slug, slug)).limit(1);
  if (!game) return null;
  const [genreRows, platformRows, studioRows] = await Promise.all([
    db.select({ name: genres.namePt }).from(gameGenres).innerJoin(genres, eq(genres.id, gameGenres.genreId)).where(eq(gameGenres.gameId, game.id)),
    db
      .select({ name: sql<string>`coalesce(${platforms.shortName}, ${platforms.name})` })
      .from(gamePlatforms)
      .innerJoin(platforms, eq(platforms.id, gamePlatforms.platformId))
      .where(eq(gamePlatforms.gameId, game.id)),
    db
      .select({ name: studios.name, role: gameStudios.role })
      .from(gameStudios)
      .innerJoin(studios, eq(studios.id, gameStudios.studioId))
      .where(eq(gameStudios.gameId, game.id)),
  ]);
  return { ...game, genres: genreRows.map((g) => g.name), platforms: platformRows.map((p) => p.name), studios: studioRows };
}
