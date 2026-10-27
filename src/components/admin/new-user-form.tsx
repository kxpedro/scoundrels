"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries";
import { createUserWithPassword } from "@/lib/admin/actions";
import { PASSWORD_MIN } from "@/lib/auth-constants";
import { roles } from "@/lib/session-roles";
import { generatePassword } from "./password";

type Labels = Dictionary["newsroom"]["users"];

const field =
  "mt-1 block w-full border-[1.5px] border-line-strong bg-panel px-3 py-1.5 text-fg placeholder:text-muted focus:border-cyan focus:outline-none";

/** "+ Novo usuário": cria a conta com senha inicial e mostra a senha uma única vez. */
export function NewUserForm({ labels: l, roleNames }: { labels: Labels; roleNames: Dictionary["roles"] }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "critic", mustChangePassword: true });
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setForm({ name: "", email: "", password: generatePassword(), role: "critic", mustChangePassword: true });
    setCreated(null);
    setCopied(false);
    setError(null);
  }

  if (!open) {
    return (
      <Button
        variant="primary"
        onClick={() => {
          reset();
          setOpen(true);
        }}
      >
        {l.newUser}
      </Button>
    );
  }

  if (created) {
    return (
      <div className="w-full max-w-md border border-cyan/50 bg-panel p-4">
        <p className="text-[13px] text-cyan">{l.form.created}</p>
        <p className="mt-1 text-[13px] text-muted">{created.email}</p>
        <div className="mt-2 flex gap-2">
          <code className="font-mono flex-1 bg-ink px-3 py-1.5 text-fg select-all">{created.password}</code>
          <Button
            onClick={async () => {
              await navigator.clipboard.writeText(created.password);
              setCopied(true);
            }}
          >
            {copied ? l.form.copied : l.form.copy}
          </Button>
        </div>
        <div className="mt-3 flex gap-2">
          <Button variant="primary" onClick={reset}>
            {l.newUser}
          </Button>
          <Button onClick={() => setOpen(false)}>{l.form.cancel}</Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="w-full max-w-md space-y-3 border border-line-strong bg-panel/50 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const res = await createUserWithPassword(form);
          if (!res.ok) return setError(l.errors[res.error]);
          setCreated({ email: form.email, password: form.password });
        });
      }}
    >
      <h2 className="font-display text-base text-fg">{l.form.title}</h2>
      <label className="block">
        <span className="label-mono text-[10px] text-label">{l.form.name}</span>
        <input required maxLength={60} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
      </label>
      <label className="block">
        <span className="label-mono text-[10px] text-label">{l.form.email}</span>
        <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} />
      </label>
      <label className="block">
        <span className="label-mono text-[10px] text-label">{l.form.password}</span>
        <span className="flex gap-2">
          <input
            required
            minLength={PASSWORD_MIN}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className={`${field} font-mono`}
            autoComplete="new-password"
          />
          <Button type="button" className="mt-1 shrink-0" onClick={() => setForm({ ...form, password: generatePassword() })}>
            {l.form.generate}
          </Button>
        </span>
      </label>
      <label className="block">
        <span className="label-mono text-[10px] text-label">{l.form.role}</span>
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={field}>
          {roles.map((r) => (
            <option key={r} value={r}>
              {roleNames[r]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-[13px]">
        <input
          type="checkbox"
          checked={form.mustChangePassword}
          onChange={(e) => setForm({ ...form, mustChangePassword: e.target.checked })}
          className="accent-cyan"
        />
        {l.form.mustChange}
      </label>
      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" disabled={pending}>
          {l.form.create}
        </Button>
        <Button type="button" onClick={() => setOpen(false)}>
          {l.form.cancel}
        </Button>
      </div>
      <p className="text-[11px] text-muted">{l.form.once}</p>
      {error && (
        <p role="alert" className="text-[13px] text-red">
          {error}
        </p>
      )}
    </form>
  );
}
