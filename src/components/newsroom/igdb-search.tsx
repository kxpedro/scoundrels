"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries";
import { igdbCoverUrl } from "@/lib/igdb-images";
import { importIgdbGame, searchIgdb, type IgdbSearchResult } from "@/lib/newsroom/actions";

type Labels = Dictionary["newsroom"]["games"];

export function IgdbSearch({ labels, initialTerm }: { labels: Labels; initialTerm: string }) {
  const [term, setTerm] = useState(initialTerm);
  const [result, setResult] = useState<IgdbSearchResult | null>(null);
  const [importing, setImporting] = useState<number | null>(null);
  const [searching, startSearch] = useTransition();
  const [, startImport] = useTransition();

  function search(e?: React.FormEvent) {
    e?.preventDefault();
    startSearch(async () => setResult(await searchIgdb(term)));
  }

  function importGame(id: number) {
    setImporting(id);
    startImport(async () => {
      const res = await importIgdbGame(id);
      setImporting(null);
      if (res.ok && result?.ok) {
        setResult({ ...result, games: result.games.map((g) => (g.id === id ? { ...g, inCatalog: true } : g)) });
      }
    });
  }

  return (
    <section>
      <form onSubmit={search} className="flex max-w-lg gap-2" role="search">
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={labels.igdbPlaceholder}
          aria-label={labels.igdbSearch}
          className="flex-1 border-[1.5px] border-line-strong bg-panel px-3 py-1.5 text-fg placeholder:text-muted focus:border-cyan focus:outline-none"
        />
        <Button type="submit" disabled={searching || term.trim().length < 2}>
          {searching ? "…" : labels.search}
        </Button>
      </form>

      {result && !result.ok && (
        <p role="alert" className="mt-3 text-[13px] text-red">
          {result.error === "not_configured" ? labels.notConfigured : labels.noResults}
        </p>
      )}
      {result?.ok && result.games.length === 0 && <p className="mt-3 text-muted">{labels.noResults}</p>}

      {result?.ok && result.games.length > 0 && (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {result.games.map((g) => {
            const year = g.first_release_date ? new Date(g.first_release_date * 1000).getUTCFullYear() : null;
            const dev = g.involved_companies?.find((c) => c.developer)?.company.name;
            return (
              <li key={g.id} className="chamfer flex gap-3 bg-panel p-2.5">
                <div className="relative h-20 w-[60px] shrink-0 bg-raised">
                  {g.cover && (
                    <Image src={igdbCoverUrl(g.cover.image_id, "t_cover_small")} alt="" fill sizes="60px" className="object-cover" />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium text-fg">{g.name}</span>
                  <span className="label-mono truncate text-[10px] text-muted">
                    {[year, dev].filter(Boolean).join(" · ")}
                  </span>
                  <span className="label-mono mt-0.5 truncate text-[10px] text-label">
                    {g.platforms?.map((p) => p.abbreviation ?? p.name).join(" · ")}
                  </span>
                  <div className="mt-auto pt-1.5">
                    {g.inCatalog ? (
                      <span className="label-mono text-[10px] text-cyan">✓ {labels.imported}</span>
                    ) : (
                      <Button className="px-2.5 py-0.5 text-xs" disabled={importing !== null} onClick={() => importGame(g.id)}>
                        {importing === g.id ? "…" : labels.import}
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
