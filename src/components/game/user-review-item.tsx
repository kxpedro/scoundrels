import Link from "next/link";
import { ScoreBadge } from "@/components/ui/score-badge";
import { Tag, type TagVariant } from "@/components/ui/tag";
import { path, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { RelativeTime } from "@/components/ui/relative-time";

type PlayStatus = "playing" | "finished" | "wishlist" | "dropped";

/** Cor e rota do status (ver "Status de jogo" no design system). */
const statusMeta: Record<PlayStatus, { variant: TagVariant; slug: string }> = {
  playing: { variant: "amber", slug: "jogando" },
  finished: { variant: "cyan", slug: "zerados" },
  wishlist: { variant: "label", slug: "quero-jogar" },
  dropped: { variant: "red", slug: "abandonados" },
};

type Review = {
  id: string;
  score: number;
  body: string | null;
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
        {review.body && <p className="mt-1">{review.body}</p>}
        <div className="mt-1.5 flex gap-4 text-[13px] text-muted">
          <span className="inline-flex items-center gap-1">
            <HeartIcon /> {review.likeCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <CommentIcon /> {review.commentCount}
          </span>
        </div>
      </div>
    </article>
  );
}

function HeartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 5h16v11H9l-5 4Z" />
    </svg>
  );
}
