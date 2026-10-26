"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ReportButton } from "@/components/reviews/report-button";
import { RelativeTime } from "@/components/ui/relative-time";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries";
import { t } from "@/i18n/interpolate";
import { cn } from "@/lib/cn";
import { addComment, deleteComment, listComments, type CommentRow } from "@/lib/social/actions";
import { COMMENT_MAX_CHARS, type CommentKind } from "@/lib/social/constants";

type Labels = { social: Dictionary["social"]; report: Dictionary["report"]; time: Dictionary["time"]; roles: Dictionary["roles"] };

/**
 * "▾ N comentários": a conversa só é buscada quando aberta (as páginas continuam leves e cacheadas).
 * Sem respostas aninhadas — mais antigos primeiro.
 */
export function CommentsThread({
  kind,
  reviewId,
  count,
  lang,
  labels,
}: {
  kind: CommentKind;
  reviewId: string;
  count: number;
  lang: string;
  labels: Labels;
}) {
  const l = labels.social;
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<CommentRow[] | null>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [total, setTotal] = useState(count);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const loginHref = `/${lang}/entrar`;

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && rows === null) {
      startTransition(async () => {
        const res = await listComments(kind, reviewId);
        setRows(res.rows);
        setViewerId(res.viewerId);
      });
    }
  }

  function send(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await addComment(kind, reviewId, draft);
      if (!res.ok) {
        setError(l.errors[res.error]);
        return;
      }
      setRows((r) => [...(r ?? []), res.comment]);
      setViewerId(res.comment.author.id);
      setTotal((n) => n + 1);
      setDraft("");
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await deleteComment(id);
      if (res.ok) {
        setRows((r) => (r ?? []).filter((c) => c.id !== id));
        setTotal((n) => Math.max(0, n - 1));
      }
    });
  }

  const label = open ? l.hide : total === 0 ? l.commentsNone : t(total === 1 ? l.commentsOne : l.comments, { n: total });

  return (
    <>
      <button type="button" onClick={toggle} aria-expanded={open} className="inline-flex items-center gap-1 hover:text-fg">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M4 5h16v11H9l-5 4Z" />
        </svg>
        {label}
      </button>

      {open && (
        <div className="mt-2 w-full basis-full border-l-2 border-line-strong pl-3 text-[14px] text-body">
          {rows === null ? (
            <p className="label-mono text-[11px] text-muted">…</p>
          ) : rows.length === 0 ? (
            <p className="text-[13px] text-muted">{l.empty}</p>
          ) : (
            <ul className="space-y-2.5">
              {rows.map((c) => {
                const staff = c.author.role !== "user";
                const handle = c.author.handle ?? c.author.name;
                return (
                  <li key={c.id}>
                    <div className="flex flex-wrap items-center gap-2 text-[13px]">
                      <Link href={`/${lang}/u/${handle}`} className="link-hot font-medium text-fg">
                        {c.author.name || handle}
                      </Link>
                      {staff && (
                        <span className="label-mono text-[10px] text-brand">{labels.roles[c.author.role as keyof Labels["roles"]]}</span>
                      )}
                      <RelativeTime date={c.createdAt} labels={labels.time} className="label-mono text-[10px] text-muted" />
                    </div>
                    <p className="whitespace-pre-line">{c.body}</p>
                    <div className="mt-0.5 flex flex-wrap gap-3 text-[12px] text-muted">
                      {viewerId === c.author.id ? (
                        <button type="button" onClick={() => remove(c.id)} className="hover:text-red">
                          {l.remove}
                        </button>
                      ) : (
                        <ReportButton
                          target="comment"
                          reviewId={c.id}
                          author={handle}
                          loginHref={loginHref}
                          labels={labels.report}
                          errors={l.errors}
                        />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <form onSubmit={send} className="mt-3 flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, COMMENT_MAX_CHARS))}
              placeholder={l.placeholder}
              aria-label={l.placeholder}
              className="min-w-0 flex-1 border-[1.5px] border-line-strong bg-panel px-2.5 py-1.5 text-fg placeholder:text-muted focus:border-cyan focus:outline-none"
            />
            <Button type="submit" disabled={pending || !draft.trim()}>
              {l.send}
            </Button>
          </form>
          {error && (
            <p role="alert" className={cn("mt-1 text-[13px]", "text-red")}>
              {error}{" "}
              {error === l.errors.auth && (
                <Link href={loginHref} className="text-cyan underline">
                  {l.loginToComment}
                </Link>
              )}
            </p>
          )}
        </div>
      )}
    </>
  );
}
