import { GameCard } from "@/components/game/game-card";
import { SectionHeader } from "@/components/ui/section-header";
import { path } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { listRecentGames } from "@/lib/queries/games";

export default async function HomePage() {
  const [lang, dict, games] = await Promise.all([getLocale(), getDictionary(), listRecentGames()]);

  return (
    <>
      <section className="py-14">
        <p className="label-mono text-[13px] text-magenta">{dict.home.kicker}</p>
        <h1 className="font-display mt-2 max-w-3xl text-4xl leading-[1.05] text-fg uppercase sm:text-6xl">
          {dict.home.headline}
        </h1>
        <p className="mt-4 max-w-xl text-lg">{dict.home.lead}</p>
      </section>

      <section>
        <SectionHeader title={dict.home.latest} href={path(lang, "/jogos")} linkLabel={dict.game.seeAll} />
        {games.length ? (
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
            {games.map((g) => (
              <GameCard key={g.slug} game={g} lang={lang} />
            ))}
          </div>
        ) : (
          <p className="text-muted">{dict.home.empty}</p>
        )}
      </section>
    </>
  );
}
