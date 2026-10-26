import Link from "next/link";
import { ScoreBadge } from "@/components/ui/score-badge";
import { path, type Locale } from "@/i18n/config";
import { Cover } from "./cover";

type Game = {
  slug: string;
  title: string;
  coverUrl: string | null;
  criticScore: number | null;
  userScore: number | null;
};

/** Card de jogo com selos SCD/PUB sobre a capa. */
export function GameCard({ game, lang }: { game: Game; lang: Locale }) {
  return (
    <Link href={path(lang, `/jogos/${game.slug}`)} className="lift-lg group relative block" aria-label={game.title}>
      <Cover
        title={game.title}
        slug={game.slug}
        url={game.coverUrl}
        titleAt="top"
        sizes="(min-width: 640px) 25vw, 50vw"
        className="aspect-[3/4] w-full"
      />
      <span className="absolute bottom-2 left-2 flex flex-col items-start gap-1">
        <ScoreBadge variant="card" kind="critic" value={game.criticScore} />
        <ScoreBadge variant="card" kind="user" value={game.userScore} />
      </span>
    </Link>
  );
}
