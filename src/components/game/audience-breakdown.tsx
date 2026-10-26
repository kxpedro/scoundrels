import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";

/** Barra positivas/mistas/negativas + porcentagens clicáveis (filtram as reviews). */
export function AudienceBreakdown({
  positive,
  mixed,
  negative,
  baseHref,
  dict,
}: {
  positive: number;
  mixed: number;
  negative: number;
  baseHref: string;
  dict: Dictionary;
}) {
  const total = positive + mixed + negative;
  if (total === 0) return null;

  const parts = [
    { key: "positivas", label: dict.game.positive, n: positive, bar: "bg-cyan", text: "text-cyan" },
    { key: "mistas", label: dict.game.mixed, n: mixed, bar: "bg-amber", text: "text-amber" },
    { key: "negativas", label: dict.game.negative, n: negative, bar: "bg-red", text: "text-red" },
  ].map((p) => ({ ...p, pct: Math.round((p.n / total) * 100) }));

  return (
    <div>
      <div className="flex h-2" aria-hidden>
        {parts.map((p) => (
          <span key={p.key} className={p.bar} style={{ width: `${(p.n / total) * 100}%` }} />
        ))}
      </div>
      <div className="mt-2.5 mb-2 flex flex-wrap gap-x-6 gap-y-1">
        {parts.map((p) => (
          <Link key={p.key} href={`${baseHref}?tom=${p.key}`} className="group flex items-baseline gap-2">
            <span className={cn("font-score text-[22px] font-bold", p.text)}>{p.pct}%</span>
            <span className="label-mono text-[13px] text-fg group-hover:text-brand group-hover:underline">{p.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
