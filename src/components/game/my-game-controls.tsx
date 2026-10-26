import { AddToList } from "@/components/social/add-to-list";
import { path, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getMyReview } from "@/lib/reviews/queries";
import { getSession } from "@/lib/session";
import { PlayStatusButtons } from "./play-status-buttons";

type Props = { gameId: string; gameSlug: string; lang: Locale; dict: Dictionary };

function statusLabels(dict: Dictionary) {
  return {
    playing: dict.game.statusPlaying,
    finished: dict.game.statusFinished,
    wishlist: dict.game.statusWishlist,
    dropped: dict.game.statusDropped,
  };
}

/** Controles pessoais do hero do jogo (status + listas). Lê a sessão → fica sob <Suspense>. */
export async function MyGameControls({ gameId, gameSlug, lang, dict }: Props) {
  const session = await getSession();
  const status = session ? (await getMyReview(session.user.id, gameId)).status : null;
  const loginHref = `${path(lang, "/entrar")}?next=${encodeURIComponent(path(lang, `/jogos/${gameSlug}`))}`;

  return (
    <>
      <PlayStatusButtons gameId={gameId} initial={status} signedIn={Boolean(session)} loginHref={loginHref} labels={statusLabels(dict)} />
      <AddToList gameId={gameId} signedIn={Boolean(session)} loginHref={loginHref} labels={dict.lists} />
    </>
  );
}

/** Mesmos controles, sem sessão — usados como fallback enquanto a sessão carrega. */
export function MyGameControlsFallback({ gameId, gameSlug, lang, dict }: Props) {
  const loginHref = `${path(lang, "/entrar")}?next=${encodeURIComponent(path(lang, `/jogos/${gameSlug}`))}`;
  return (
    <>
      <PlayStatusButtons gameId={gameId} initial={null} signedIn={false} loginHref={loginHref} labels={statusLabels(dict)} />
      <AddToList gameId={gameId} signedIn={false} loginHref={loginHref} labels={dict.lists} />
    </>
  );
}
