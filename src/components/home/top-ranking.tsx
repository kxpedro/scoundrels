"use client";

import Link from "next/link";
import { useState } from "react";
import { formatScore, scoreTone } from "@/lib/score";
import { cn } from "@/lib/cn";

type Row = { slug: string; title: string; criticScore: number | null; userScore: number | null };
type Tab = { key: "ano" | "todos" | "publico"; label: string; rows: Row[] };

const toneText = { brand: "text-brand", cyan: "text-cyan", amber: "text-amber", red: "text-red" } as const;

/** Ranking da home com abas. As três listas já chegam do servidor (cacheadas); a troca é só no cliente. */
export function TopRanking({ tabs, lang, empty }: { tabs: Tab[]; lang: string; empty: string }) {
  const [active, setActive] = useState(tabs[0].key);
  const tab = tabs.find((t) => t.key === active) ?? tabs[0];
  const isPublic = tab.key === "publico";

  return (
    <div>
      {tab.rows.length ? (
        <ol className="flex flex-col gap-2">
          {tab.rows.map((g, i) => {
            const value = isPublic ? g.userScore : g.criticScore;
            return (
              <li key={g.slug}>
                <Link href={`/${lang}/jogos/${g.slug}`} className="group flex items-center gap-3">
                  <span className="font-score w-4 font-bold text-brand">{i + 1}</span>
                  <span className="flex-1 truncate text-fg group-hover:text-brand">{g.title}</span>
                  {value !== null && (
                    <span className={cn("font-score font-bold", toneText[scoreTone(value, isPublic ? "user" : "critic")])}>
                      {formatScore(value, { average: true })}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-[13px] text-muted">{empty}</p>
      )}
      <div role="tablist" className="label-mono mt-3 flex gap-3 text-[10px]">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={t.key === active}
            onClick={() => setActive(t.key)}
            className="text-muted hover:text-fg aria-selected:text-brand aria-selected:underline aria-selected:underline-offset-4"
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
