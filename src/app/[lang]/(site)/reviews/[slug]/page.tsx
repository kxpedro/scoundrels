import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Cover } from "@/components/game/cover";
import { EditReviewLink } from "@/components/review/edit-review-link";
import { ReviewBody } from "@/components/review/review-body";
import { CommentsThread } from "@/components/social/comments-thread";
import { LikeButton } from "@/components/social/like-button";
import { CriticByline } from "@/components/ui/critic-byline";
import { ScoreBadge } from "@/components/ui/score-badge";
import { Tag } from "@/components/ui/tag";
import { path } from "@/i18n/config";
import { getDictionary, getLocale, t } from "@/i18n/dictionaries";
import { formatCount } from "@/lib/format";
import { getPublishedReview } from "@/lib/queries/games";

export async function generateMetadata({ params }: PageProps<"/[lang]/reviews/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublishedReview(slug);
  if (!data) return {};
  return {
    title: `${data.game.title}: ${data.review.title}`,
    description: data.review.excerpt ?? undefined,
    openGraph: { type: "article", images: data.game.coverUrl ? [data.game.coverUrl] : undefined },
  };
}

export default function ReviewPage(props: PageProps<"/[lang]/reviews/[slug]">) {
  return (
    <Suspense fallback={<div className="mx-auto h-96 max-w-3xl animate-pulse bg-panel" aria-hidden />}>
      <ReviewContent params={props.params} />
    </Suspense>
  );
}

async function ReviewContent({ params }: Pick<PageProps<"/[lang]/reviews/[slug]">, "params">) {
  const { slug } = await params;
  const [data, lang, dict] = await Promise.all([getPublishedReview(slug), getLocale(), getDictionary()]);
  if (!data) notFound();

  const { review, game, author, platform } = data;
  const gameHref = path(lang, `/jogos/${game.slug}`);
  const senior = author.role === "editor" || author.role === "admin";
  const date = review.publishedAt
    ? new Intl.DateTimeFormat(lang === "pt" ? "pt-BR" : "en-US", { dateStyle: "long" }).format(review.publishedAt)
    : null;

  return (
    <article className="mx-auto max-w-3xl pt-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={gameHref} className="link-hot label-mono text-[13px] text-cyan">
          ← {game.title}
        </Link>
        <Suspense fallback={null}>
          <EditReviewLink reviewId={review.id} authorId={review.authorId} lang={lang} label={dict.newsroom.reviewAdmin.editOnNewsroom} />
        </Suspense>
      </div>

      <header className="mt-4 grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <h1 className="font-display text-3xl leading-tight text-fg sm:text-4xl">{review.title}</h1>
          {review.excerpt && <p className="mt-3 text-lg text-muted">{review.excerpt}</p>}
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
            <CriticByline
              href={path(lang, `/criticos/${author.handle}`)}
              name={author.name}
              roleLabel={author.title ?? dict.roles[author.role as keyof typeof dict.roles] ?? dict.roles.critic}
              highlight={senior}
            />
            {date && <span className="label-mono text-[11px] text-muted">{date}</span>}
            {platform && (
              <span className="flex items-center gap-2">
                <span className="label-mono text-[11px] text-muted">{dict.review.tested}</span>
                <Tag variant="platform" href={path(lang, `/jogos?plataforma=${platform.slug}`)}>
                  {platform.shortName ?? platform.name}
                </Tag>
              </span>
            )}
          </div>
        </div>
        <div className="flex items-start gap-3 sm:flex-col sm:items-end">
          <ScoreBadge variant="hero" kind="critic" value={review.score} label={dict.game.scoundrel} />
        </div>
      </header>

      {(review.pros.length > 0 || review.cons.length > 0) && (
        <div className="mt-8 grid gap-4 border-y border-line py-5 sm:grid-cols-2">
          <ProsCons title={dict.review.pros} items={review.pros} sign="+" tone="text-cyan" />
          <ProsCons title={dict.review.cons} items={review.cons} sign="-" tone="text-red" />
        </div>
      )}

      <div className="mt-8">
        <ReviewBody doc={review.body} />
      </div>

      <div className="mt-8 flex flex-wrap items-start gap-5 border-t border-line pt-4 text-[13px] text-muted">
        <LikeButton kind="critic" id={review.id} count={review.likeCount} loginHref={path(lang, "/entrar")} labels={dict.social} />
        <CommentsThread
          kind="critic"
          reviewId={review.id}
          count={review.commentCount}
          lang={lang}
          labels={{ social: dict.social, report: dict.report, time: dict.time, roles: dict.roles }}
        />
      </div>

      <aside className="chamfer mt-12 flex flex-wrap items-center gap-5 bg-panel p-4">
        <Cover title={game.title} slug={game.slug} url={game.coverUrl} sizes="72px" className="h-24 w-[72px] shrink-0" />
        <div className="min-w-0 flex-1">
          <Link href={gameHref} className="link-hot font-display text-lg text-fg uppercase">
            {game.title}
          </Link>
          <div className="mt-2 flex gap-2">
            <ScoreBadge variant="card" kind="critic" value={game.criticScore} href={`${gameHref}/criticas`} />
            <ScoreBadge variant="card" kind="user" value={game.userScore} href={`${gameHref}/publico`} />
          </div>
          <p className="label-mono mt-1.5 text-[10px] text-muted">
            {t(game.criticCount === 1 ? dict.game.criticsOne : dict.game.critics, { count: game.criticCount })} · {t(game.userCount === 1 ? dict.game.ratingsOne : dict.game.ratings, { count: formatCount(game.userCount, lang) })}
          </p>
        </div>
      </aside>
    </article>
  );
}

function ProsCons({ title, items, sign, tone }: { title: string; items: string[]; sign: string; tone: string }) {
  if (!items.length) return <div />;
  return (
    <div>
      <h2 className={`label-mono text-[11px] ${tone}`}>{title}</h2>
      <ul className="mt-2 space-y-1">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className={`font-mono ${tone}`}>[{sign}]</span>
            <span className="text-fg">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
