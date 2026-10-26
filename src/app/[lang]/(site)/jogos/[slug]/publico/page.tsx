import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AudienceBreakdown } from "@/components/game/audience-breakdown";
import { GameSubpageHeader } from "@/components/game/game-subpage-header";
import { UserReviewItem } from "@/components/game/user-review-item";
import { path } from "@/i18n/config";
import { getDictionary, getLocale, t } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import { getGameBySlug, getUserReviews, type Tone } from "@/lib/queries/games";

const tones: Tone[] = ["positivas", "mistas", "negativas"];

export async function generateMetadata({ params }: PageProps<"/[lang]/jogos/[slug]/publico">): Promise<Metadata> {
  const { slug } = await params;
  const [game, dict] = await Promise.all([getGameBySlug(slug), getDictionary()]);
  return game ? { title: t(dict.gamePages.publicTitle, { game: game.title }) } : {};
}

export default function GamePublicPage(props: PageProps<"/[lang]/jogos/[slug]/publico">) {
  return (
    <Suspense fallback={<div className="mt-6 h-64 animate-pulse bg-panel" aria-hidden />}>
      <Content params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Content({ params, searchParams }: Pick<PageProps<"/[lang]/jogos/[slug]/publico">, "params" | "searchParams">) {
  const [{ slug }, sp, lang, dict] = await Promise.all([params, searchParams, getLocale(), getDictionary()]);
  const game = await getGameBySlug(slug);
  if (!game) notFound();

  const tone = tones.find((x) => x === sp.tom);
  const reviews = await getUserReviews(game.id, 100, tone);
  const gameHref = path(lang, `/jogos/${game.slug}`);
  const base = `${gameHref}/publico`;
  const toneLabel = { positivas: dict.game.positive, mistas: dict.game.mixed, negativas: dict.game.negative };

  return (
    <>
      <GameSubpageHeader
        game={game}
        gameHref={gameHref}
        kind="user"
        scoreLabel={dict.game.public}
        title={t(dict.gamePages.publicTitle, { game: game.title })}
        backLabel={t(dict.gamePages.back, { game: game.title })}
      />

      <div className="mt-8">
        <AudienceBreakdown
          positive={game.userPositive}
          mixed={game.userMixed}
          negative={game.userNegative}
          baseHref={base}
          dict={dict}
        />
      </div>

      <nav className="label-mono mt-2 mb-2 flex gap-4 text-[11px]" aria-label={dict.game.userReviews}>
        <Link href={base} aria-current={!tone ? "true" : undefined} className={cn(!tone ? "text-brand" : "text-label hover:text-fg")}>
          {dict.gamePages.all}
        </Link>
        {tones.map((x) => (
          <Link
            key={x}
            href={`${base}?tom=${x}`}
            aria-current={tone === x ? "true" : undefined}
            className={cn(tone === x ? "text-brand" : "text-label hover:text-fg")}
          >
            {toneLabel[x]}
          </Link>
        ))}
      </nav>

      {reviews.length ? (
        reviews.map((r) => <UserReviewItem key={r.id} review={r} lang={lang} dict={dict} />)
      ) : (
        <p className="py-6 text-muted">{dict.game.noUserReviews}</p>
      )}
    </>
  );
}
