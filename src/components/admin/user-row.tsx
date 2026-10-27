"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries";
import { t } from "@/i18n/interpolate";
import {
  deleteUserAccount,
  revokeUserSessions,
  setUserPassword,
  setUserRole,
  setUserSuspended,
  updateUserDetails,
} from "@/lib/admin/actions";
import { PASSWORD_MIN } from "@/lib/auth-constants";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";
import { roles } from "@/lib/session-roles";
import { generatePassword } from "./password";

type Labels = Dictionary["newsroom"]["users"];

export type UserRowData = {
  id: string;
  name: string;
  email: string;
  handle: string | null;
  role: string;
  title: string | null;
  createdAt: string;
  bannedAt: string | null;
  banReason: string | null;
  mustChangePassword: boolean;
  providers: string[];
};

type Panel = "edit" | "password" | null;

const field =
  "block w-full border-[1.5px] border-line-strong bg-ink px-2.5 py-1 text-[13px] text-fg placeholder:text-muted focus:border-cyan focus:outline-none";

export function UserRow({
  u,
  isSelf,
  labels: l,
  roleNames,
}: {
  u: UserRowData;
  isSelf: boolean;
  labels: Labels;
  roleNames: Dictionary["roles"];
}) {
  const [menu, setMenu] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [details, setDetails] = useState({ name: u.name, handle: u.handle ?? "", email: u.email, title: u.title ?? "" });
  const [newPassword, setNewPassword] = useState("");
  const [mustChange, setMustChange] = useState(true);
  const [pending, startTransition] = useTransition();
  const staff = u.role !== "user";
  const suspended = Boolean(u.bannedAt);
  const displayName = u.name || u.email;

  const methods = u.providers.length
    ? u.providers.map((p) => l.methods[p as keyof Labels["methods"]] ?? p)
    : [l.methods.link];

  function run(action: () => Promise<{ ok: boolean; error?: string }>, success?: string) {
    setMessage(null);
    setMenu(false);
    startTransition(async () => {
      const res = await action();
      if (!res.ok) setMessage({ ok: false, text: l.errors[res.error as keyof Labels["errors"]] ?? "" });
      else if (success) setMessage({ ok: true, text: success });
    });
  }

  return (
    <li className={cn("border-b border-line py-2.5", suspended && "opacity-70")}>
      <div className="grid grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-3 sm:grid-cols-[34px_minmax(0,1.3fr)_minmax(0,1fr)_120px_auto]">
        <span
          className={cn(
            "chamfer-sm font-score flex size-[34px] items-center justify-center text-xs font-bold",
            u.role === "admin" || u.role === "editor" ? "bg-brand text-on-brand" : suspended ? "bg-raised text-red" : "bg-raised text-cyan",
          )}
          aria-hidden
        >
          {initials(displayName)}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate font-medium text-fg">{displayName}</span>
            {suspended && <span className="label-mono bg-red/15 px-1.5 text-[10px] text-red">{l.suspendedBadge}</span>}
            {u.mustChangePassword && <span className="label-mono bg-amber/15 px-1.5 text-[10px] text-amber">{l.mustChangeBadge}</span>}
          </div>
          <div className="label-mono truncate text-[10px] text-muted">
            {suspended && u.banReason ? t(l.reason, { reason: u.banReason }) : `@${u.handle ?? "—"} · ${t(l.since, { date: u.createdAt })}`}
          </div>
        </div>
        <div className="hidden min-w-0 sm:block">
          <div className="truncate">{u.email}</div>
          <div className="label-mono truncate text-[10px] text-muted">{methods.join(" · ")}</div>
        </div>

        {isSelf ? (
          <span className="label-mono hidden text-[10px] text-brand sm:block">{roleNames[u.role as keyof typeof roleNames]}</span>
        ) : (
          <select
            aria-label={l.columns.role}
            defaultValue={u.role}
            disabled={pending}
            onChange={(e) => run(() => setUserRole(u.id, e.target.value), l.form.saved)}
            className={cn(field, "hidden py-0.5 sm:block", staff && "text-brand")}
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {roleNames[r]}
              </option>
            ))}
          </select>
        )}

        {isSelf ? (
          <span className="label-mono text-[10px] text-muted">{l.you}</span>
        ) : (
          <div className="relative flex gap-1.5">
            {suspended && (
              <Button className="px-2 py-0.5 text-xs" disabled={pending} onClick={() => run(() => setUserSuspended(u.id, false), l.form.saved)}>
                {l.actions.reactivate}
              </Button>
            )}
            <Button className="px-2 py-0.5 text-xs" aria-label={l.actions.menu} aria-expanded={menu} onClick={() => setMenu(!menu)}>
              ⋯
            </Button>
            {menu && (
              <div className="absolute top-full right-0 z-20 mt-1 flex w-60 flex-col border border-line-strong bg-panel py-1 text-left text-[13px] shadow-hard">
                <MenuItem onClick={() => (setPanel("edit"), setMenu(false))}>{l.actions.edit}</MenuItem>
                <MenuItem
                  onClick={() => {
                    setNewPassword(generatePassword());
                    setPanel("password");
                    setMenu(false);
                  }}
                >
                  {l.actions.password}
                </MenuItem>
                <MenuItem onClick={() => run(() => revokeUserSessions(u.id), l.form.sessionsDone)}>{l.actions.sessions}</MenuItem>
                {!suspended && (
                  <MenuItem
                    tone="text-amber"
                    onClick={() => {
                      if (!window.confirm(t(l.form.suspendConfirm, { name: displayName }))) return;
                      const reason = window.prompt(l.form.suspendReason) ?? "";
                      run(() => setUserSuspended(u.id, true, reason), l.form.saved);
                    }}
                  >
                    {l.actions.suspend}
                  </MenuItem>
                )}
                <MenuItem
                  tone="text-red"
                  onClick={() => {
                    if (window.confirm(t(l.form.deleteConfirm, { name: displayName }))) run(() => deleteUserAccount(u.id));
                  }}
                >
                  {l.actions.delete}
                </MenuItem>
              </div>
            )}
          </div>
        )}
      </div>

      {panel === "edit" && (
        <form
          className="mt-3 grid gap-2 border border-line-strong p-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => updateUserDetails(u.id, details), l.form.saved);
            setPanel(null);
          }}
        >
          <input aria-label={l.form.name} value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} className={field} placeholder={l.form.name} />
          <input
            aria-label={l.form.handle}
            value={details.handle}
            onChange={(e) => setDetails({ ...details, handle: e.target.value.toLowerCase() })}
            className={field}
            placeholder={l.form.handle}
          />
          <input aria-label={l.form.email} type="email" value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} className={field} />
          <input aria-label={l.form.jobTitle} value={details.title} onChange={(e) => setDetails({ ...details, title: e.target.value })} className={field} placeholder={l.form.jobTitle} />
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" variant="primary" disabled={pending}>
              {l.form.save}
            </Button>
            <Button type="button" onClick={() => setPanel(null)}>
              {l.form.cancel}
            </Button>
          </div>
        </form>
      )}

      {panel === "password" && (
        <form
          className="mt-3 flex flex-wrap items-center gap-2 border border-line-strong p-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => setUserPassword(u.id, newPassword, mustChange), `${l.form.passwordSet} ${newPassword}`);
            setPanel(null);
          }}
        >
          <input
            aria-label={l.form.newPassword}
            minLength={PASSWORD_MIN}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={cn(field, "font-mono w-56")}
            autoComplete="new-password"
          />
          <Button type="button" onClick={() => setNewPassword(generatePassword())}>
            {l.form.generate}
          </Button>
          <label className="flex items-center gap-1.5 text-[13px]">
            <input type="checkbox" checked={mustChange} onChange={(e) => setMustChange(e.target.checked)} className="accent-cyan" />
            {l.form.mustChange}
          </label>
          <Button type="submit" variant="primary" disabled={pending || newPassword.length < PASSWORD_MIN}>
            {l.form.setPassword}
          </Button>
          <Button type="button" onClick={() => setPanel(null)}>
            {l.form.cancel}
          </Button>
        </form>
      )}

      {message && (
        <p role="status" className={cn("mt-1.5 text-[13px]", message.ok ? "text-cyan" : "text-red")}>
          {message.text}
        </p>
      )}
    </li>
  );
}

function MenuItem({ children, onClick, tone }: { children: React.ReactNode; onClick: () => void; tone?: string }) {
  return (
    <button type="button" onClick={onClick} className={cn("px-3 py-1.5 text-left hover:bg-raised", tone ?? "text-body")}>
      {children}
    </button>
  );
}
