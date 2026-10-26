import Link from "next/link";
import { ScoreBadge } from "@/components/ui/score-badge";
import { path, type Locale } from "@/i18n/config";
import type { ReviewCard } from "@/lib/queries/reviews";

/** Lista compacta de críticas: nota, jogo e título. */
export function LatestCritics({ reviews, lang }: { reviews: ReviewCard[]; lang: Locale }) {
  return (
    <ul className="flex flex-col gap-3">
      {reviews.map((r) => (
        <li key={r.slug}>
          <Link href={path(lang, `/reviews/${r.slug}`)} className="group flex items-center gap-3">
            <ScoreBadge variant="inline" kind="critic" value={r.score} className="shrink-0" />
            <span className="min-w-0">
              <span className="block truncate font-medium text-fg group-hover:text-brand">{r.game.title}</span>
              <span className="block truncate text-xs text-muted">“{r.title}”</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
