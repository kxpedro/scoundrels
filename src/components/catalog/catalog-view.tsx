import Link from "next/link";
import { GameCard } from "@/components/game/game-card";
import { type Locale } from "@/i18n/config";
import { t, type Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import { formatReleaseDate } from "@/lib/format";
import {
  CATALOG_PAGE_SIZE,
  catalogSorts,
  getCatalogFacets,
  getFilterLabels,
  listCatalog,
  type CatalogFilters,
  type CatalogSort,
} from "@/lib/queries/catalog";

export type CatalogParams = CatalogFilters & { page: number };

/** Lê ?genero=&plataforma=&lancamento=&ordem=&pagina= da URL. */
export function parseCatalogParams(sp: Record<string, string | string[] | undefined>): CatalogParams {
  const one = (k: string) => {
    const v = sp[k];
    const s = Array.isArray(v) ? v[0] : v;
    return s && /^[a-z0-9-]{1,80}$/.test(s) ? s : undefined;
  };
  const sort = one("ordem");
  const page = Number(one("pagina") ?? 1);
  return {
    genre: one("genero"),
    platform: one("plataforma"),
    release: one("lancamento"),
    sort: catalogSorts.includes(sort as CatalogSort) ? (sort as CatalogSort) : "nota",
    page: Number.isInteger(page) && page > 0 && page <= 20 ? page : 1,
  };
}

/**
 * Lista de jogos filtrável. Os filtros são links (sem JS) — cada clique é uma URL compartilhável.
 * `basePath` é a rota atual (/pt/jogos ou /pt/estudios/x); `fixed` são filtros da própria rota.
 */
export async function CatalogView({
  params,
  basePath,
  lang,
  dict,
  title,
  fixed = {},
}: {
  params: CatalogParams;
  basePath: string;
  lang: Locale;
  dict: Dictionary;
  title?: string;
  fixed?: Partial<CatalogFilters>;
}) {
  const { page, ...fromUrl } = params;
  const filters: CatalogFilters = { ...fromUrl, ...fixed };
  const limit = CATALOG_PAGE_SIZE * page;
  const [{ rows, total }, facets, labels] = await Promise.all([
    listCatalog(filters, limit),
    getCatalogFacets(),
    getFilterLabels(filters),
  ]);
  const l = dict.catalog;

  // Monta href mantendo os filtros atuais e alterando um (null remove). Mudou filtro → volta à página 1.
  const href = (change: Partial<Record<"genero" | "plataforma" | "lancamento" | "ordem" | "pagina", string | null>>) => {
    const qs = new URLSearchParams();
    const current = {
      genero: params.genre,
      plataforma: params.platform,
      lancamento: params.release,
      ordem: params.sort === "nota" ? undefined : params.sort,
      pagina: undefined as string | undefined,
    };
    for (const [k, v] of Object.entries({ ...current, ...change })) if (v) qs.set(k, v);
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  const heading =
    title ??
    (labels.genre ? (lang === "pt" ? labels.genre.pt : labels.genre.en) : null) ??
    labels.platform ??
    (filters.release ? t(l.releasedIn, { date: formatRelease(filters.release) }) : l.title);
  const hasFilters = Boolean(params.genre || params.platform || params.release);

  return (
    <section className="pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-2xl text-fg sm:text-3xl">
          {heading}{" "}
          <span className="label-mono align-middle text-xs text-muted">· {t(total === 1 ? l.countOne : l.count, { n: total })}</span>
        </h1>
        <nav aria-label={l.sort} className="label-mono flex flex-wrap gap-3 text-[11px]">
          <span className="text-muted">{l.sort}:</span>
          {(
            [
              ["nota", l.sortNota],
              ["publico", l.sortPublico],
              ["lancamento", l.sortLancamento],
            ] as const
          ).map(([key, label]) => (
            <Link
              key={key}
              href={href({ ordem: key === "nota" ? null : key })}
              aria-current={filters.sort === key ? "true" : undefined}
              className={cn(filters.sort === key ? "text-brand" : "text-label hover:text-fg")}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="my-4 flex flex-wrap items-center gap-1.5">
        {!fixed.genre &&
          facets.genres.map((g) => (
            <Chip key={g.slug} active={params.genre === g.slug} tone="genre" href={href({ genero: params.genre === g.slug ? null : g.slug })}>
              {lang === "pt" ? g.namePt : g.nameEn}
            </Chip>
          ))}
        <span className="w-2" aria-hidden />
        {facets.platforms.map((p) => (
          <Chip
            key={p.slug}
            active={params.platform === p.slug}
            tone="platform"
            href={href({ plataforma: params.platform === p.slug ? null : p.slug })}
          >
            {p.shortName ?? p.name}
          </Chip>
        ))}
        <span className="w-2" aria-hidden />
        {facets.years.map((y) => (
          <Chip key={y} active={params.release === y} tone="neutral" href={href({ lancamento: params.release === y ? null : y })}>
            {y}
          </Chip>
        ))}
        {hasFilters && (
          <Link href={basePath} className="link-hot label-mono ml-2 text-[11px] text-muted">
            × {l.clear}
          </Link>
        )}
      </div>

      {rows.length ? (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4 lg:grid-cols-6">
          {rows.map((g) => (
            <GameCard key={g.slug} game={g} lang={lang} />
          ))}
        </div>
      ) : (
        <p className="py-10 text-muted">{l.empty}</p>
      )}

      {rows.length < total && (
        <div className="mt-8 text-center">
          <Link href={href({ pagina: String(params.page + 1) })} scroll={false} className="link-hot label-mono text-[13px] text-cyan">
            {l.loadMore} ↓
          </Link>
        </div>
      )}
    </section>
  );
}

function formatRelease(release: string): string {
  return release.length === 7 ? formatReleaseDate(`${release}-01`).slice(3) : release;
}

function Chip({
  href,
  active,
  tone,
  children,
}: {
  href: string;
  active: boolean;
  tone: "genre" | "platform" | "neutral";
  children: React.ReactNode;
}) {
  const styles = {
    genre: active ? "border-magenta bg-magenta text-on-magenta" : "border-line-strong text-label hover:border-magenta hover:text-magenta",
    platform: active ? "border-cyan bg-cyan text-on-cyan" : "border-cyan/60 text-cyan hover:border-cyan",
    neutral: active ? "border-brand bg-brand text-on-brand" : "border-line-strong text-label hover:border-brand hover:text-brand",
  }[tone];
  return (
    <Link
      href={href}
      aria-pressed={active}
      scroll={false}
      className={cn("label-mono border-[1.5px] px-2 py-0.5 text-[11px] transition-colors", styles)}
    >
      {children}
      {active && " ×"}
    </Link>
  );
}
