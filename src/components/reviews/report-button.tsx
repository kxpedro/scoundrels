"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries";
import { t } from "@/i18n/interpolate";
import { reportUserReview } from "@/lib/reviews/actions";
import { reportReasons, type ReportReason } from "@/lib/reviews/constants";

type Props = {
  reviewId: string;
  author: string;
  loginHref: string;
  labels: Dictionary["report"];
  errors: Dictionary["userReview"]["errors"];
};

/** "⚑ Denunciar" que abre um painel no lugar (fluxo aprovado no mockup 3). */
export function ReportButton({ reviewId, author, loginHref, labels, errors }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("spoiler");
  const [state, setState] = useState<"idle" | "sent" | "auth" | { error: string }>("idle");
  const [pending, startTransition] = useTransition();

  if (state === "sent") return <span className="text-cyan">{labels.sent}</span>;
  if (state === "auth")
    return (
      <Link href={loginHref} className="link-hot text-cyan">
        {labels.login} →
      </Link>
    );

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1 hover:text-red">
        <span aria-hidden>⚑</span> {labels.action}
      </button>
    );
  }

  function send() {
    startTransition(async () => {
      const res = await reportUserReview(reviewId, reason);
      if (res.ok) setState("sent");
      else if (res.error === "auth") setState("auth");
      else setState({ error: errors[res.error] });
    });
  }

  return (
    <div className="mt-2 w-full max-w-sm basis-full border border-red/40 bg-panel p-3 text-[13px] text-body">
      <p className="label-mono mb-2 text-[11px] text-red">{t(labels.title, { user: author })}</p>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="sr-only">{labels.title}</legend>
        {reportReasons.map((r) => (
          <label key={r} className="flex items-center gap-2">
            <input type="radio" name={`reason-${reviewId}`} checked={reason === r} onChange={() => setReason(r)} className="accent-red" />
            {labels.reasons[r]}
          </label>
        ))}
      </fieldset>
      <div className="mt-3 flex gap-2">
        <Button className="border-red text-red" disabled={pending} onClick={send}>
          {labels.send}
        </Button>
        <Button onClick={() => setOpen(false)}>{labels.cancel}</Button>
      </div>
      {typeof state === "object" && (
        <p role="alert" className="mt-2 text-red">
          {state.error}
        </p>
      )}
      <p className="mt-2 text-[11px] text-muted">{labels.note}</p>
    </div>
  );
}
