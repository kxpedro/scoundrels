import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AudienceBreakdown } from "@/components/game/audience-breakdown";
import { CriticReviewCard } from "@/components/game/critic-review-card";
import { GameCard } from "@/components/game/game-card";
import { GameHero } from "@/components/game/game-hero";
import { UserReviewItem } from "@/components/game/user-review-item";
import { MyReview } from "@/components/reviews/my-review";
import { SectionHeader } from "@/components/ui/section-header";
import { path } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { getCriticReviews, getGameBySlug, getSimilarGames, getUserReviews } from "@/lib/queries/games";

export async function generateMetadata({ params }: PageProps<"/[lang]/jogos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  return game ? { title: game.title, description: game.summary ?? undefined } : {};
}

export default function GamePage(props: PageProps<"/[lang]/jogos/[slug]">) {
  return (
    <Suspense fallback={<GameSkeleton />}>
      <GameContent params={props.params} />
    </Suspense>
  );
}

async function GameContent({ params }: Pick<PageProps<"/[lang]/jogos/[slug]">, "params">) {
  const { slug } = await params;
  const [game, lang, dict] = await Promise.all([getGameBySlug(slug), getLocale(), getDictionary()]);
  if (!game) notFound();

  const [critics, users, similar] = await Promise.all([
    getCriticReviews(game.id),
    getUserReviews(game.id),
    getSimilarGames(game.id),
  ]);
  const base = path(lang, `/jogos/${game.slug}`);

  return (
    <>
      <GameHero game={game} lang={lang} dict={dict} />

      <section className="pt-10">
        <SectionHeader title={dict.game.criticReviews} href={`${base}/criticas`} linkLabel={dict.game.seeAll} />
        {critics.length ? (
          <div className="grid gap-3.5 md:grid-cols-2">
            {critics.map((r) => (
              <CriticReviewCard key={r.slug} review={r} lang={lang} dict={dict} />
            ))}
          </div>
        ) : (
          <p className="text-muted">{dict.game.noCriticReviews}</p>
        )}
      </section>

      <section className="pt-10">
        <SectionHeader title={dict.game.userReviews} href={`${base}/publico`} linkLabel={dict.game.seeAll} />
        <Suspense fallback={null}>
          <MyReview gameId={game.id} gameSlug={game.slug} lang={lang} dict={dict} />
        </Suspense>
        <AudienceBreakdown
          positive={game.userPositive}
          mixed={game.userMixed}
          negative={game.userNegative}
          baseHref={`${base}/publico`}
          dict={dict}
        />
        {users.length ? (
          users.map((r) => <UserReviewItem key={r.id} review={r} lang={lang} dict={dict} />)
        ) : (
          <p className="text-muted">{dict.game.noUserReviews}</p>
        )}
      </section>

      {similar.length > 0 && (
        <section className="pt-10">
          <SectionHeader title={dict.game.similar} />
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            {similar.map((g) => (
              <GameCard key={g.slug} game={g} lang={lang} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function GameSkeleton() {
  return (
    <div className="flex animate-pulse gap-6 pt-5" aria-hidden>
      <div className="chamfer h-[214px] w-40 bg-panel" />
      <div className="flex-1 space-y-3">
        <div className="h-5 w-40 bg-panel" />
        <div className="h-9 w-3/4 bg-panel" />
        <div className="h-5 w-1/2 bg-panel" />
        <div className="flex gap-3 pt-2">
          <div className="chamfer h-20 w-24 bg-panel" />
          <div className="chamfer h-20 w-24 bg-panel" />
        </div>
      </div>
    </div>
  );
}
