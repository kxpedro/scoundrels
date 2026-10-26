import Link from "next/link";
import { Cover } from "@/components/game/cover";
import { ScoreBadge } from "@/components/ui/score-badge";
import type { GameDetail } from "@/lib/queries/games";

/** Cabeçalho compacto das subpáginas do jogo (críticas, público). */
export function GameSubpageHeader({
  game,
  gameHref,
  title,
  kind,
  scoreLabel,
  backLabel,
}: {
  game: GameDetail;
  gameHref: string;
  title: string;
  kind: "critic" | "user";
  scoreLabel: string;
  backLabel: string;
}) {
  return (
    <header className="flex items-center gap-4 pt-6">
      <Cover title={game.title} slug={game.slug} url={game.coverUrl} sizes="56px" className="h-[74px] w-14 shrink-0" />
      <div className="min-w-0 flex-1">
        <Link href={gameHref} className="link-hot label-mono text-[11px] text-cyan">
          ← {backLabel}
        </Link>
        <h1 className="font-display mt-1 truncate text-xl text-fg sm:text-2xl">{title}</h1>
      </div>
      <ScoreBadge variant="hero" kind={kind} value={kind === "critic" ? game.criticScore : game.userScore} label={scoreLabel} />
    </header>
  );
}
