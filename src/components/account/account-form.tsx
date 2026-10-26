"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries";
import { updateProfile } from "@/lib/social/actions";
import { HANDLE_PATTERN } from "@/lib/social/constants";

const field =
  "mt-1 block w-full border-[1.5px] border-line-strong bg-panel px-3 py-2 text-fg placeholder:text-muted focus:border-cyan focus:outline-none";

export function AccountForm({
  initial,
  lang,
  labels,
  errors,
}: {
  initial: { name: string; handle: string; bio: string };
  lang: string;
  labels: Dictionary["account"];
  errors: Dictionary["social"]["errors"];
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [state, setState] = useState<{ ok: boolean; message: string } | null>(null);
  const [savedHandle, setSavedHandle] = useState(initial.handle);
  const [pending, startTransition] = useTransition();
  const handleValid = HANDLE_PATTERN.test(form.handle);

  return (
    <form
      className="max-w-lg space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setState(null);
        startTransition(async () => {
          const res = await updateProfile(form);
          if (!res.ok) return setState({ ok: false, message: errors[res.error] });
          setSavedHandle(res.handle);
          setState({ ok: true, message: labels.saved });
          router.refresh();
        });
      }}
    >
      <label className="block">
        <span className="label-mono text-[10px] text-label">{labels.name}</span>
        <input required maxLength={60} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
      </label>
      <label className="block">
        <span className="label-mono text-[10px] text-label">{labels.handle}</span>
        <span className="mt-1 flex items-center">
          <span className="font-mono border-[1.5px] border-r-0 border-line-strong bg-raised px-2.5 py-2 text-muted">@</span>
          <input
            required
            maxLength={30}
            value={form.handle}
            onChange={(e) => setForm({ ...form, handle: e.target.value.toLowerCase() })}
            aria-invalid={!handleValid}
            className={`${field} mt-0 aria-[invalid=true]:border-red`}
          />
        </span>
        <span className="mt-1 block text-[12px] text-muted">{labels.handleHint}</span>
      </label>
      <label className="block">
        <span className="label-mono text-[10px] text-label">{labels.bio}</span>
        <textarea
          rows={3}
          maxLength={280}
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          placeholder={labels.bioPh}
          className={field}
        />
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" variant="primary" disabled={pending || !handleValid || !form.name.trim()}>
          {labels.save}
        </Button>
        <Link href={`/${lang}/u/${savedHandle}`} className="link-hot text-[13px] text-cyan">
          {labels.viewProfile} →
        </Link>
        {state && (
          <p role="status" className={state.ok ? "text-[13px] text-cyan" : "text-[13px] text-red"}>
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
