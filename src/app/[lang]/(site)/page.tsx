import { GameCard } from "@/components/game/game-card";
import { FeaturedReview } from "@/components/home/featured-review";
import { LatestCritics } from "@/components/home/latest-critics";
import { TopRanking } from "@/components/home/top-ranking";
import { SectionHeader } from "@/components/ui/section-header";
import { path } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { listRecentGames } from "@/lib/queries/games";
import { listLatestCriticReviews, listTopGames } from "@/lib/queries/reviews";

export default async function HomePage() {
  const [lang, dict, latest, recent, topYear, topAll, topPublic] = await Promise.all([
    getLocale(),
    getDictionary(),
    listLatestCriticReviews(6),
    listRecentGames(8),
    listTopGames("ano"),
    listTopGames("todos"),
    listTopGames("publico"),
  ]);
  const [featured, ...others] = latest;

  if (!featured) {
    return (
      <section className="py-14">
        <h1 className="font-display text-4xl text-fg uppercase">{dict.home.headline}</h1>
        <p className="mt-4 text-muted">{dict.home.empty}</p>
      </section>
    );
  }

  return (
    <>
      <h1 className="sr-only">{dict.home.headline}</h1>

      <section className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <FeaturedReview review={featured} lang={lang} dict={dict} />
        <div>
          <SectionHeader title={dict.home.latestCritics} href={path(lang, "/reviews")} linkLabel={dict.game.seeAll} />
          <LatestCritics reviews={others.slice(0, 5)} lang={lang} />
        </div>
      </section>

      <section className="grid gap-8 pt-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div>
          <SectionHeader title={dict.home.latest} href={path(lang, "/jogos?ordem=lancamento")} linkLabel={dict.game.seeAll} />
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            {recent.map((g) => (
              <GameCard key={g.slug} game={g} lang={lang} />
            ))}
          </div>
        </div>
        <div>
          <SectionHeader title={dict.home.top} href={path(lang, "/jogos")} linkLabel={dict.game.seeAll} />
          <TopRanking
            lang={lang}
            empty={dict.home.topEmpty}
            tabs={[
              { key: "todos", label: dict.home.topAll, rows: topAll },
              { key: "ano", label: dict.home.topYear, rows: topYear },
              { key: "publico", label: dict.home.topPublic, rows: topPublic },
            ]}
          />
        </div>
      </section>
    </>
  );
}
