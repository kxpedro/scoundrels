import Link from "next/link";
import { CriticByline } from "@/components/ui/critic-byline";
import { ScoreBadge } from "@/components/ui/score-badge";
import { path, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

type Review = {
  slug: string;
  title: string;
  excerpt: string | null;
  score: number | null;
  author: { name: string; handle: string | null; role: string; title: string | null };
};

export function CriticReviewCard({ review, lang, dict }: { review: Review; lang: Locale; dict: Dictionary }) {
  const { author } = review;
  const senior = author.role === "editor" || author.role === "admin";
  const roleLabel = author.title ?? dict.roles[author.role as keyof Dictionary["roles"]] ?? dict.roles.critic;

  return (
    <article className="chamfer border-t-3 border-brand bg-panel p-4">
      <div className="flex items-center justify-between gap-2.5">
        <CriticByline
          href={path(lang, `/criticos/${author.handle}`)}
          name={author.name}
          roleLabel={roleLabel}
          highlight={senior}
        />
        {review.score !== null && <ScoreBadge variant="inline" kind="critic" value={review.score} />}
      </div>
      <h3 className="mt-3 mb-1.5 text-base font-medium text-fg">
        <Link href={path(lang, `/reviews/${review.slug}`)} className="link-hot">
          {review.title}
        </Link>
      </h3>
      {review.excerpt && <p className="text-[13px] text-muted">{review.excerpt}</p>}
    </article>
  );
}
