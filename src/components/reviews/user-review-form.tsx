"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries";
import { t } from "@/i18n/interpolate";
import { cn } from "@/lib/cn";
import { saveUserReview } from "@/lib/reviews/actions";
import { reviewPlayStatuses, USER_REVIEW_MAX_CHARS, type ReviewPlayStatus } from "@/lib/reviews/constants";
import { scoreTone } from "@/lib/score";

const toneText = { brand: "text-brand", cyan: "text-cyan", amber: "text-amber", red: "text-red" } as const;
const toneBorder = { brand: "border-t-brand", cyan: "border-t-cyan", amber: "border-t-amber", red: "border-t-red" } as const;
const toneAccent = { brand: "accent-brand", cyan: "accent-cyan", amber: "accent-amber", red: "accent-red" } as const;

type Props = {
  gameId: string;
  gameHref: string;
  initial: { score: number; body: string; hasSpoilers: boolean; status: ReviewPlayStatus | null } | null;
  /** Já existe review deste usuário (muda o texto do botão). */
  editing: boolean;
  labels: Dictionary["userReview"];
};

/** Formulário da review do público (opção 1A: régua com selo colorido ao vivo). */
export function UserReviewForm({ gameId, gameHref, initial, editing, labels: l }: Props) {
  const router = useRouter();
  const [score, setScore] = useState(initial?.score ?? 7);
  const [status, setStatus] = useState<ReviewPlayStatus | null>(initial?.status ?? null);
  const [body, setBody] = useState(initial?.body ?? "");
  const [hasSpoilers, setHasSpoilers] = useState(initial?.hasSpoilers ?? false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const tone = scoreTone(score, "user");
  const statusLabel: Record<ReviewPlayStatus, string> = { playing: l.playing, finished: l.finished, dropped: l.dropped };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await saveUserReview({ gameId, score, body, hasSpoilers, status });
      if (!res.ok) {
        setError(l.errors[res.error]);
        return;
      }
      router.push(gameHref);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="max-w-2xl">
      <div className="flex flex-wrap items-center gap-5">
        <output
          htmlFor="score"
          className={cn("chamfer-sm flex w-[72px] flex-col items-center border-t-3 bg-panel py-1.5", toneBorder[tone])}
          aria-live="polite"
        >
          <span className={cn("font-score text-[32px] leading-none font-bold", toneText[tone])}>{score.toFixed(1)}</span>
          <span className="label-mono text-[10px] text-muted">/10</span>
        </output>
        <div className="min-w-[220px] flex-1">
          <input
            id="score"
            type="range"
            min={0}
            max={10}
            step={0.5}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            aria-label={l.scoreLabel}
            className={cn("w-full", toneAccent[tone])}
          />
          <div className="label-mono flex justify-between text-[10px]" aria-hidden>
            <span className="text-red">{l.bad}</span>
            <span className="text-amber">{l.mixed}</span>
            <span className="text-cyan">{l.great}</span>
          </div>
        </div>
      </div>

      <fieldset className="mt-6">
        <legend className="label-mono mb-2 text-[10px] text-label">{l.youAlready}</legend>
        <div className="flex flex-wrap gap-2">
          {reviewPlayStatuses.map((s) => (
            <Button key={s} type="button" aria-pressed={status === s} onClick={() => setStatus(status === s ? null : s)}>
              {statusLabel[s]}
            </Button>
          ))}
        </div>
      </fieldset>

      <label className="mt-6 block">
        <span className="label-mono text-[10px] text-label">
          {l.opinion} <span className="text-muted">· {l.optional}</span>
        </span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, USER_REVIEW_MAX_CHARS))}
          rows={6}
          placeholder={l.placeholder}
          className="mt-1.5 block w-full resize-y border-[1.5px] border-line-strong bg-panel px-3 py-2 text-fg placeholder:text-muted focus:border-cyan focus:outline-none"
        />
      </label>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <label className={cn("flex items-center gap-2 text-[13px]", !body.trim() && "opacity-40")}>
          <input
            type="checkbox"
            checked={hasSpoilers}
            disabled={!body.trim()}
            onChange={(e) => setHasSpoilers(e.target.checked)}
            className="accent-magenta"
          />
          {l.spoilers}
        </label>
        <span className="label-mono text-[10px] text-muted">{t(l.chars, { n: body.length, max: USER_REVIEW_MAX_CHARS })}</span>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <Button type="submit" variant="primary" disabled={pending}>
          {editing ? l.update : l.publish}
        </Button>
        {error && (
          <p role="alert" className="text-[13px] text-red">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
