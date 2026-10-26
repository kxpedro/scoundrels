import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { gameGenres, gamePlatforms, games, gameStudios, genres, platforms, studios } from "@/db/schema";
import { genreNamesPt, igdbCoverUrl, type IgdbGame } from "@/lib/igdb";
import { slugify } from "@/lib/slug";

/** Slug livre: se já existir para outro jogo, acrescenta o ano ou um sufixo. */
async function freeGameSlug(base: string, year: string | null, igdbId: number | null): Promise<string> {
  const candidates = [base, year ? `${base}-${year}` : null, `${base}-${Date.now().toString(36)}`].filter(Boolean) as string[];
  for (const slug of candidates) {
    const [hit] = await db.select({ igdbId: games.igdbId }).from(games).where(eq(games.slug, slug)).limit(1);
    if (!hit || (igdbId !== null && hit.igdbId === igdbId)) return slug;
  }
  return candidates[candidates.length - 1];
}

/**
 * Importa (ou atualiza) um jogo do IGDB com gêneros, plataformas e estúdios.
 * Idempotente por igdb_id. Devolve o slug do jogo no catálogo.
 */
export async function upsertIgdbGame(g: IgdbGame): Promise<{ id: string; slug: string }> {
  const releaseDate = g.first_release_date ? new Date(g.first_release_date * 1000).toISOString().slice(0, 10) : null;
  // Slug pelo nome (o do IGDB vem com desambiguação tipo "hades--1"); colisão ganha o ano.
  const slug = await freeGameSlug(slugify(g.name) || g.slug, releaseDate?.slice(0, 4) ?? null, g.id);

  return db.transaction(async (tx) => {
    const values = {
      igdbId: g.id,
      slug,
      title: g.name,
      summary: g.summary ?? null,
      coverUrl: g.cover ? igdbCoverUrl(g.cover.image_id) : null,
      releaseDate,
    };
    const [game] = await tx
      .insert(games)
      .values(values)
      .onConflictDoUpdate({
        target: games.igdbId,
        set: { title: values.title, summary: values.summary, coverUrl: values.coverUrl, releaseDate: values.releaseDate },
      })
      .returning({ id: games.id, slug: games.slug });

    // Gêneros/plataformas/estúdios casam por slug (podem já existir sem igdb_id, via seed ou cadastro manual).
    // Relações são recriadas a cada import para refletir o IGDB.
    await tx.delete(gameGenres).where(eq(gameGenres.gameId, game.id));
    await tx.delete(gamePlatforms).where(eq(gamePlatforms.gameId, game.id));
    await tx.delete(gameStudios).where(eq(gameStudios.gameId, game.id));

    for (const genre of g.genres ?? []) {
      const [row] = await tx
        .insert(genres)
        .values({ igdbId: genre.id, slug: genre.slug, nameEn: genre.name, namePt: genreNamesPt[genre.slug] ?? genre.name })
        .onConflictDoUpdate({ target: genres.slug, set: { igdbId: genre.id, nameEn: genre.name } })
        .returning({ id: genres.id });
      await tx.insert(gameGenres).values({ gameId: game.id, genreId: row.id }).onConflictDoNothing();
    }

    for (const p of g.platforms ?? []) {
      const [row] = await tx
        .insert(platforms)
        .values({ igdbId: p.id, slug: p.slug, name: p.name, shortName: p.abbreviation?.toUpperCase() ?? null })
        .onConflictDoUpdate({ target: platforms.slug, set: { igdbId: p.id, name: p.name } })
        .returning({ id: platforms.id });
      await tx.insert(gamePlatforms).values({ gameId: game.id, platformId: row.id }).onConflictDoNothing();
    }

    for (const ic of g.involved_companies ?? []) {
      const roles = [ic.developer && "developer", ic.publisher && "publisher"].filter(Boolean) as Array<"developer" | "publisher">;
      if (!roles.length) continue;
      const [row] = await tx
        .insert(studios)
        .values({ igdbId: ic.company.id, slug: ic.company.slug || slugify(ic.company.name), name: ic.company.name })
        .onConflictDoUpdate({ target: studios.slug, set: { igdbId: ic.company.id, name: ic.company.name } })
        .returning({ id: studios.id });
      for (const role of roles) {
        await tx.insert(gameStudios).values({ gameId: game.id, studioId: row.id, role }).onConflictDoNothing();
      }
    }

    return game;
  });
}

export async function createManualGame(title: string, releaseDate: string | null) {
  const slug = await freeGameSlug(slugify(title), releaseDate?.slice(0, 4) ?? null, null);
  const [game] = await db.insert(games).values({ slug, title, releaseDate }).returning({ id: games.id, slug: games.slug });
  return game;
}
