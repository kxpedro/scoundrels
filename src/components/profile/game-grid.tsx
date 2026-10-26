import Link from "next/link";
import { Cover } from "@/components/game/cover";
import { path, type Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { formatScore, scoreTone } from "@/lib/score";

const toneBg = { brand: "bg-brand text-on-brand", cyan: "bg-cyan text-on-cyan", amber: "bg-amber text-on-amber", red: "bg-red text-on-red" } as const;

/** Grade de capas do perfil com a nota da própria pessoa no canto (quando houver). */
export function ProfileGameGrid({
  games,
  lang,
}: {
  games: Array<{ slug: string; title: string; coverUrl: string | null; score: number | null }>;
  lang: Locale;
}) {
  return (
    <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {games.map((g) => (
        <li key={g.slug}>
          <Link href={path(lang, `/jogos/${g.slug}`)} className="lift-lg relative block" title={g.title}>
            <Cover title={g.title} slug={g.slug} url={g.coverUrl} titleAt="top" sizes="(min-width: 1024px) 160px, 30vw" className="aspect-[3/4] w-full" />
            {g.score !== null && (
              <span className={cn("chamfer-sm font-score absolute bottom-1.5 left-1.5 px-1.5 text-xs font-bold", toneBg[scoreTone(g.score, "user")])}>
                {formatScore(g.score)}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
