import Image from "next/image";
import { isOptimizableCover } from "@/lib/igdb-images";
import Link from "next/link";
import { ScoreBadge } from "@/components/ui/score-badge";
import { path, type Locale } from "@/i18n/config";
import { t, type Dictionary } from "@/i18n/dictionaries";
import type { ReviewCard } from "@/lib/queries/reviews";

/** Review em destaque da home: capa ao fundo, título e nota. Um dos dois elementos com sombra sólida da tela. */
export function FeaturedReview({ review, lang, dict }: { review: ReviewCard; lang: Locale; dict: Dictionary }) {
  return (
    <Link
      href={path(lang, `/reviews/${review.slug}`)}
      className="chamfer group shadow-hard-lg relative flex min-h-64 flex-col justify-end overflow-hidden bg-raised p-5 sm:min-h-80"
    >
      {review.game.coverUrl && (
        <Image
          src={review.game.coverUrl}
          unoptimized={!isOptimizableCover(review.game.coverUrl)}
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 640px, 100vw"
          className="object-cover opacity-45 transition-transform duration-300 group-hover:scale-[1.03]"
        />
      )}
      {/* Véu para garantir contraste do texto sobre qualquer capa */}
      <span className="absolute inset-0 bg-ink/55" aria-hidden />
      <ScoreBadge variant="inline" size="lg" kind="critic" value={review.score} className="absolute top-4 right-4" />
      <span className="relative">
        <span className="label-mono text-[11px] text-magenta">{dict.home.featured}</span>
        <span className="font-display mt-1 block text-2xl leading-tight text-fg group-hover:text-brand sm:text-3xl">
          {review.title}
        </span>
        <span className="mt-1.5 block text-label">
          {review.game.title} · {t(dict.home.by, { name: review.author.name })}
        </span>
      </span>
    </Link>
  );
}
