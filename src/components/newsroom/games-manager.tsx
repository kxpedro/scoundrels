import Link from "next/link";
import { Cover } from "@/components/game/cover";
import { path, type Locale } from "@/i18n/config";
import { t, type Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import { formatReleaseDate } from "@/lib/format";
import { countNewsroomGames, listNewsroomGames } from "@/lib/newsroom/queries";
import { GameRowActions } from "./game-row-actions";

/** Lista do catálogo na redação (mockup 1): abas ativos/arquivados, busca e ações por jogo. */
export async function GamesManager({
  archived,
  term,
  isAdmin,
  lang,
  dict,
}: {
  archived: boolean;
  term: string;
  isAdmin: boolean;
  lang: Locale;
  dict: Dictionary;
}) {
  const l = dict.newsroom.games;
  const [rows, counts] = await Promise.all([listNewsroomGames({ archived, term }), countNewsroomGames()]);
  const base = path(lang, "/redacao/jogos");

  return (
    <section className="mt-10">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <nav className="label-mono flex gap-4 text-[11px]" aria-label={l.title}>
          <Link href={base} aria-current={!archived ? "page" : undefined} className={cn(!archived ? "text-brand" : "text-label hover:text-fg")}>
            {l.active} {counts.active}
          </Link>
          <Link
            href={`${base}?arquivados=1`}
            aria-current={archived ? "page" : undefined}
            className={cn(archived ? "text-brand" : "text-label hover:text-fg")}
          >
            {l.archivedTab} {counts.archived}
          </Link>
        </nav>
        <form role="search" className="flex gap-1.5">
          {archived && <input type="hidden" name="arquivados" value="1" />}
          <input
            name="filtro"
            defaultValue={term}
            placeholder={l.searchCatalog}
            aria-label={l.searchCatalog}
            className="w-48 border-[1.5px] border-line-strong bg-panel px-2.5 py-1 text-[13px] text-fg placeholder:text-muted focus:border-cyan focus:outline-none"
          />
        </form>
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-muted">{archived ? l.emptyArchived : l.noResults}</p>
      ) : (
        <ul className="divide-y divide-line">
          {rows.map((g) => {
            const reviews = g.criticReviews + g.userReviews;
            const meta = [
              g.releaseDate ? formatReleaseDate(g.releaseDate).slice(-4) : null,
              g.igdbId ? "IGDB" : l.manualSource,
              reviews === 0 ? l.noReviews : null,
              g.criticReviews ? t(l.critics, { n: g.criticReviews }) : null,
              g.userReviews ? t(l.ratings, { n: g.userReviews }) : null,
            ].filter(Boolean);
            return (
              <li key={g.id} className={cn("grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 py-2.5", g.archivedAt && "opacity-70")}>
                <Cover title={g.title} slug={g.slug} url={g.coverUrl} sizes="40px" className="h-[53px] w-10" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium text-fg">{g.title}</span>
                    {g.archivedAt && <span className="label-mono bg-amber/15 px-1.5 text-[10px] text-amber">{l.archivedBadge}</span>}
                  </div>
                  <div className="label-mono text-[10px] text-muted">{g.archivedAt ? l.archivedHint : meta.join(" · ")}</div>
                </div>
                <GameRowActions
                  game={{ id: g.id, title: g.title, archived: Boolean(g.archivedAt) }}
                  editHref={`${base}/${g.slug}`}
                  canDelete={isAdmin && reviews === 0}
                  labels={l}
                />
              </li>
            );
          })}
        </ul>
      )}
      {!archived && <p className="mt-3 text-[11px] text-muted">{l.deleteHint}</p>}
    </section>
  );
}
