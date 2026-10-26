import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CriticReviewCard } from "@/components/game/critic-review-card";
import { GameSubpageHeader } from "@/components/game/game-subpage-header";
import { path } from "@/i18n/config";
import { getDictionary, getLocale, t } from "@/i18n/dictionaries";
import { getCriticReviews, getGameBySlug } from "@/lib/queries/games";

export async function generateMetadata({ params }: PageProps<"/[lang]/jogos/[slug]/criticas">): Promise<Metadata> {
  const { slug } = await params;
  const [game, dict] = await Promise.all([getGameBySlug(slug), getDictionary()]);
  return game ? { title: t(dict.gamePages.criticsTitle, { game: game.title }) } : {};
}

export default function GameCriticsPage(props: PageProps<"/[lang]/jogos/[slug]/criticas">) {
  return (
    <Suspense fallback={<div className="mt-6 h-64 animate-pulse bg-panel" aria-hidden />}>
      <Content params={props.params} />
    </Suspense>
  );
}

async function Content({ params }: Pick<PageProps<"/[lang]/jogos/[slug]/criticas">, "params">) {
  const { slug } = await params;
  const [game, lang, dict] = await Promise.all([getGameBySlug(slug), getLocale(), getDictionary()]);
  if (!game) notFound();
  const reviews = await getCriticReviews(game.id, 100);
  const gameHref = path(lang, `/jogos/${game.slug}`);

  return (
    <>
      <GameSubpageHeader
        game={game}
        gameHref={gameHref}
        kind="critic"
        scoreLabel={dict.game.scoundrel}
        title={t(dict.gamePages.criticsTitle, { game: game.title })}
        backLabel={t(dict.gamePages.back, { game: game.title })}
      />
      <div className="mt-8 grid gap-3.5 md:grid-cols-2">
        {reviews.map((r) => (
          <CriticReviewCard key={r.slug} review={r} lang={lang} dict={dict} />
        ))}
      </div>
      {reviews.length === 0 && <p className="mt-8 text-muted">{dict.game.noCriticReviews}</p>}
    </>
  );
}
