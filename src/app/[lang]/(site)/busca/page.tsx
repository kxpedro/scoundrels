import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { GameCard } from "@/components/game/game-card";
import { Button } from "@/components/ui/button";
import { ScoreBadge } from "@/components/ui/score-badge";
import { path } from "@/i18n/config";
import { getDictionary, getLocale, t } from "@/i18n/dictionaries";
import { searchSite } from "@/lib/queries/search";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.search.title, robots: { index: false } };
}

export default async function SearchPage(props: PageProps<"/[lang]/busca">) {
  const dict = await getDictionary();
  return (
    <section className="pt-8">
      <h1 className="font-display text-3xl text-fg">{dict.search.title}</h1>
      <Suspense>
        <Results searchParams={props.searchParams} />
      </Suspense>
    </section>
  );
}

async function Results({ searchParams }: Pick<PageProps<"/[lang]/busca">, "searchParams">) {
  const [sp, lang, dict] = await Promise.all([searchParams, getLocale(), getDictionary()]);
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 100);
  const l = dict.search;
  const results = q.length >= 2 ? await searchSite(q) : null;
  const empty = results && !results.games.length && !results.critics.length && !results.reviews.length;

  return (
    <>
      <form role="search" className="mt-4 flex max-w-xl gap-2">
        <input
          name="q"
          type="search"
          defaultValue={q}
          autoFocus
          placeholder={l.placeholder}
          aria-label={l.title}
          className="flex-1 border-[1.5px] border-line-strong bg-panel px-3 py-2 text-fg placeholder:text-muted focus:border-cyan focus:outline-none"
        />
        <Button type="submit" variant="primary">
          {l.submit}
        </Button>
      </form>

      {!results && q && <p className="mt-6 text-muted">{l.hint}</p>}
      {empty && <p className="mt-6 text-muted">{t(l.empty, { q })}</p>}

      {results && results.games.length > 0 && (
        <div className="mt-10">
          <h2 className="label-mono mb-3 text-[11px] text-cyan">{l.games}</h2>
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4 lg:grid-cols-6">
            {results.games.map((g) => (
              <GameCard key={g.slug} game={g} lang={lang} />
            ))}
          </div>
        </div>
      )}

      {results && results.critics.length > 0 && (
        <div className="mt-10">
          <h2 className="label-mono mb-3 text-[11px] text-cyan">{l.critics}</h2>
          <ul className="flex flex-wrap gap-2">
            {results.critics.map((c) => (
              <li key={c.handle}>
                <Link href={path(lang, `/criticos/${c.handle}`)} className="lift inline-block bg-panel px-3 py-1.5 text-fg">
                  {c.name}
                  <span className="label-mono ml-2 text-[10px] text-brand">{c.title ?? dict.roles[c.role as keyof typeof dict.roles]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {results && results.reviews.length > 0 && (
        <div className="mt-10">
          <h2 className="label-mono mb-3 text-[11px] text-cyan">{l.reviews}</h2>
          <ul className="divide-y divide-line">
            {results.reviews.map((r) => (
              <li key={r.slug}>
                <Link href={path(lang, `/reviews/${r.slug}`)} className="group flex items-center gap-3 py-2.5">
                  <ScoreBadge variant="inline" kind="critic" value={r.score} className="shrink-0" />
                  <span className="min-w-0">
                    <span className="block truncate text-fg group-hover:text-brand">{r.title}</span>
                    <span className="label-mono block text-[10px] text-muted">
                      {r.game} · {r.author}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
