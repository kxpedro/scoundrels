import type { Metadata } from "next";
import Link from "next/link";
import { Cover } from "@/components/game/cover";
import { ScoreBadge } from "@/components/ui/score-badge";
import { path } from "@/i18n/config";
import { getDictionary, getLocale, t } from "@/i18n/dictionaries";
import { formatReleaseDate } from "@/lib/format";
import { listLatestCriticReviews } from "@/lib/queries/reviews";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.reviewsPage.title, description: dict.reviewsPage.lead };
}

export default async function ReviewsPage() {
  const [lang, dict, reviews] = await Promise.all([getLocale(), getDictionary(), listLatestCriticReviews(60)]);

  return (
    <section className="pt-8">
      <h1 className="font-display text-3xl text-fg">{dict.reviewsPage.title}</h1>
      <p className="mt-2 text-muted">{dict.reviewsPage.lead}</p>

      <ul className="mt-8 grid gap-3 md:grid-cols-2">
        {reviews.map((r) => (
          <li key={r.slug}>
            <Link href={path(lang, `/reviews/${r.slug}`)} className="chamfer group flex gap-3 bg-panel p-3">
              <Cover title={r.game.title} slug={r.game.slug} url={r.game.coverUrl} sizes="60px" className="h-20 w-[60px] shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="label-mono truncate text-[11px] text-cyan">{r.game.title}</span>
                  <ScoreBadge variant="inline" kind="critic" value={r.score} className="shrink-0" />
                </div>
                <p className="mt-1 line-clamp-2 font-medium text-fg group-hover:text-brand">{r.title}</p>
                <p className="label-mono mt-1 text-[10px] text-muted">
                  {t(dict.home.by, { name: r.author.name })}
                  {r.publishedAt && ` · ${formatReleaseDate(r.publishedAt.toISOString().slice(0, 10))}`}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
