import Link from "next/link";
import { ScoreBadge } from "@/components/ui/score-badge";
import { Tag, type TagVariant } from "@/components/ui/tag";
import { path, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { RelativeTime } from "@/components/ui/relative-time";
import { ReportButton } from "@/components/reviews/report-button";
import { SpoilerText } from "@/components/reviews/spoiler-text";
import { CommentsThread } from "@/components/social/comments-thread";
import { LikeButton } from "@/components/social/like-button";

type PlayStatus = "playing" | "finished" | "wishlist" | "dropped";

/** Cor e rota do status (ver "Status de jogo" no design system). */
export const statusMeta: Record<PlayStatus, { variant: TagVariant; slug: string }> = {
  playing: { variant: "amber", slug: "jogando" },
  finished: { variant: "cyan", slug: "zerados" },
  wishlist: { variant: "label", slug: "quero-jogar" },
  dropped: { variant: "red", slug: "abandonados" },
};

type Review = {
  id: string;
  score: number;
  body: string | null;
  hasSpoilers: boolean;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  author: { name: string; handle: string | null };
  playStatus: PlayStatus | null;
};

export function UserReviewItem({ review, lang, dict }: { review: Review; lang: Locale; dict: Dictionary }) {
  const handle = review.author.handle ?? review.author.name;
  const profile = path(lang, `/u/${handle}`);
  const status = review.playStatus ? statusMeta[review.playStatus] : null;

  return (
    <article className="grid grid-cols-[64px_minmax(0,1fr)] gap-4 border-b border-line py-4 last:border-b-0">
      <ScoreBadge variant="list" kind="user" value={review.score} />
      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link href={profile} className="link-hot font-medium text-fg">
            {handle}
          </Link>
          {status && review.playStatus && (
            <Tag variant={status.variant} href={`${profile}/${status.slug}`}>
              {dict.playStatus[review.playStatus]}
            </Tag>
          )}
          <RelativeTime date={review.createdAt} labels={dict.time} className="label-mono text-[11px] text-muted" />
        </div>
        {review.body &&
          (review.hasSpoilers ? (
            <SpoilerText text={review.body} label={dict.userReview.showSpoiler} />
          ) : (
            <p className="mt-1">{review.body}</p>
          ))}
        <div className="mt-1.5 flex flex-wrap items-start gap-4 text-[13px] text-muted">
          <LikeButton kind="user" id={review.id} count={review.likeCount} loginHref={path(lang, "/entrar")} labels={dict.social} />
          <ReportButton
            reviewId={review.id}
            author={handle}
            loginHref={path(lang, "/entrar")}
            labels={dict.report}
            errors={dict.userReview.errors}
          />
          <CommentsThread
            kind="user"
            reviewId={review.id}
            count={review.commentCount}
            lang={lang}
            labels={{ social: dict.social, report: dict.report, time: dict.time, roles: dict.roles }}
          />
        </div>
      </div>
    </article>
  );
}

