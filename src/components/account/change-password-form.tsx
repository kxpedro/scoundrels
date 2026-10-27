"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries";
import { changeMyPassword } from "@/lib/admin/actions";
import { PASSWORD_MIN } from "@/lib/auth-constants";

const field =
  "mt-1 block w-full border-[1.5px] border-line-strong bg-panel px-3 py-2 text-fg placeholder:text-muted focus:border-cyan focus:outline-none";

export function ChangePasswordForm({
  required,
  labels: l,
  errors,
}: {
  required: boolean;
  labels: Dictionary["passwordChange"];
  errors: Dictionary["newsroom"]["users"]["errors"];
}) {
  const router = useRouter();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      id="senha"
      className="max-w-lg space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (form.next !== form.confirm) return setMessage({ ok: false, text: l.mismatch });
        setMessage(null);
        startTransition(async () => {
          const res = await changeMyPassword(form.current, form.next);
          if (!res.ok) return setMessage({ ok: false, text: errors[res.error] });
          setForm({ current: "", next: "", confirm: "" });
          setMessage({ ok: true, text: l.saved });
          router.refresh();
        });
      }}
    >
      <h2 className="font-display text-lg text-fg">{l.title}</h2>
      {required && <p className="border-l-3 border-amber bg-amber/10 px-3 py-2 text-[13px] text-amber">{l.required}</p>}
      <label className="block">
        <span className="label-mono text-[10px] text-label">{l.current}</span>
        <input type="password" required autoComplete="current-password" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} className={field} />
      </label>
      <label className="block">
        <span className="label-mono text-[10px] text-label">{l.next}</span>
        <input
          type="password"
          required
          minLength={PASSWORD_MIN}
          autoComplete="new-password"
          value={form.next}
          onChange={(e) => setForm({ ...form, next: e.target.value })}
          className={field}
        />
      </label>
      <label className="block">
        <span className="label-mono text-[10px] text-label">{l.confirm}</span>
        <input
          type="password"
          required
          minLength={PASSWORD_MIN}
          autoComplete="new-password"
          value={form.confirm}
          onChange={(e) => setForm({ ...form, confirm: e.target.value })}
          className={field}
        />
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={pending}>
          {l.save}
        </Button>
        {message && (
          <p role="status" className={message.ok ? "text-[13px] text-cyan" : "text-[13px] text-red"}>
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
