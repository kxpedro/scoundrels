import Link from "next/link";
import { RelativeTime } from "@/components/ui/relative-time";
import { ScoreBadge } from "@/components/ui/score-badge";
import { Tag } from "@/components/ui/tag";
import { path, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getMyReview } from "@/lib/reviews/queries";
import { getSession } from "@/lib/session";
import { DeleteMyReview } from "./delete-my-review";
import { statusMeta } from "@/components/game/user-review-item";

/** "Sua review" fixada no topo da seção Público. Lê a sessão → fica sob <Suspense>. */
export async function MyReview({ gameId, gameSlug, lang, dict }: { gameId: string; gameSlug: string; lang: Locale; dict: Dictionary }) {
  const session = await getSession();
  if (!session) return null;
  const { review, status } = await getMyReview(session.user.id, gameId);
  if (!review) return null;

  const l = dict.userReview;
  const meta = status ? statusMeta[status] : null;
  const handle = session.user.handle ?? session.user.id;

  return (
    <article className="chamfer mb-2 grid grid-cols-[64px_minmax(0,1fr)] gap-4 border-l-3 border-cyan bg-panel p-3">
      <ScoreBadge variant="list" kind="user" value={review.score} />
      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="label-mono text-[10px] text-brand">{l.title}</span>
          {meta && status && (
            <Tag variant={meta.variant} href={path(lang, `/u/${handle}/${meta.slug}`)}>
              {dict.playStatus[status]}
            </Tag>
          )}
          <RelativeTime date={review.createdAt} labels={dict.time} className="label-mono text-[11px] text-muted" />
        </div>
        {review.visibility === "hidden" && <p className="mt-1 text-[13px] text-amber">{l.hiddenNotice}</p>}
        {review.body && <p className="mt-1">{review.body}</p>}
        <div className="mt-1.5 flex gap-4 text-[13px]">
          <Link href={path(lang, `/jogos/${gameSlug}/avaliar`)} className="link-hot text-cyan">
            {l.edit}
          </Link>
          <DeleteMyReview gameId={gameId} label={l.remove} confirmText={l.removeConfirm} />
        </div>
      </div>
    </article>
  );
}
