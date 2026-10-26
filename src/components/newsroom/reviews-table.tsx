import Link from "next/link";
import { RelativeTime } from "@/components/ui/relative-time";
import { ScoreBadge } from "@/components/ui/score-badge";
import { path, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { NewsroomReviewRow } from "@/lib/newsroom/queries";
import { StatusTag } from "./status-tag";

export function ReviewsTable({ rows, lang, dict }: { rows: NewsroomReviewRow[]; lang: Locale; dict: Dictionary }) {
  const nr = dict.newsroom;
  if (!rows.length) return <p className="py-6 text-muted">{nr.table.empty}</p>;

  const cols = "grid grid-cols-[minmax(0,1fr)_96px_44px] gap-3 sm:grid-cols-[minmax(0,1fr)_100px_120px_72px_44px]";

  return (
    <div className="text-[13px]">
      <div className={`${cols} label-mono border-b border-line-strong py-1.5 text-[10px] text-muted`}>
        <span>{nr.table.review}</span>
        <span>{nr.table.status}</span>
        <span className="hidden sm:block">{nr.table.author}</span>
        <span className="hidden sm:block">{nr.table.updated}</span>
        <span>{nr.table.score}</span>
      </div>
      {rows.map((r) => (
        <Link
          key={r.id}
          href={path(lang, `/redacao/reviews/${r.id}`)}
          className={`${cols} items-center border-b border-line py-2.5 transition-colors last:border-b-0 hover:bg-panel`}
        >
          <span className="min-w-0">
            <span className="block truncate font-medium text-fg">{r.game.title}</span>
            <span className="block truncate text-xs text-muted">{r.title ? `“${r.title}”` : nr.table.untitled}</span>
          </span>
          <span>
            <StatusTag status={r.status} label={nr.status[r.status]} />
          </span>
          <span className="hidden truncate sm:block">{r.author.name || r.author.email}</span>
          <RelativeTime date={r.updatedAt} labels={dict.time} className="label-mono hidden text-[11px] text-muted sm:block" />
          <span>{r.score !== null ? <ScoreBadge variant="inline" kind="critic" value={r.score} /> : "—"}</span>
        </Link>
      ))}
    </div>
  );
}
