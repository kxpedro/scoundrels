import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Cover } from "@/components/game/cover";
import { UserReviewForm } from "@/components/reviews/user-review-form";
import { path } from "@/i18n/config";
import { getDictionary, getLocale, t } from "@/i18n/dictionaries";
import { getGameBySlug } from "@/lib/queries/games";
import { getMyReview } from "@/lib/reviews/queries";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { robots: { index: false } };

export default function RateGamePage(props: PageProps<"/[lang]/jogos/[slug]/avaliar">) {
  return (
    <Suspense fallback={<div className="mt-8 h-72 max-w-2xl animate-pulse bg-panel" aria-hidden />}>
      <RateGame params={props.params} />
    </Suspense>
  );
}

async function RateGame({ params }: Pick<PageProps<"/[lang]/jogos/[slug]/avaliar">, "params">) {
  const { slug } = await params;
  const [session, lang, dict, game] = await Promise.all([getSession(), getLocale(), getDictionary(), getGameBySlug(slug)]);
  if (!game) notFound();

  const gameHref = path(lang, `/jogos/${game.slug}`);
  // Sem login: vai para a tela de entrada e volta direto para cá.
  if (!session) redirect(`${path(lang, "/entrar")}?next=${encodeURIComponent(`${gameHref}/avaliar`)}`);

  const mine = await getMyReview(session.user.id, game.id);
  const status = mine.status === "wishlist" ? null : mine.status;

  return (
    <section className="pt-8">
      <header className="mb-8 flex items-center gap-4">
        <Cover title={game.title} slug={game.slug} url={game.coverUrl} sizes="48px" className="h-16 w-12 shrink-0" />
        <div>
          <p className="label-mono text-[10px] text-cyan">{dict.userReview.title}</p>
          <h1 className="font-display text-xl text-fg uppercase sm:text-2xl">{t(dict.userReview.formTitle, { game: game.title })}</h1>
        </div>
      </header>
      <UserReviewForm
        gameId={game.id}
        gameHref={gameHref}
        labels={dict.userReview}
        editing={Boolean(mine.review)}
        initial={
          mine.review
            ? { score: mine.review.score, body: mine.review.body ?? "", hasSpoilers: mine.review.hasSpoilers, status }
            : status
              ? { score: 7, body: "", hasSpoilers: false, status }
              : null
        }
      />
    </section>
  );
}
