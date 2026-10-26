"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries";
import { setUserRole } from "@/lib/newsroom/actions";
import { roles } from "@/lib/session-roles";

type Props = { labels: Dictionary["newsroom"]["team"]; roleNames: Dictionary["roles"] };

export function RoleForm({ labels, roleNames }: Props) {
  const [state, action, pending] = useActionState(
    async (_: Awaited<ReturnType<typeof setUserRole>> | null, formData: FormData) => setUserRole(formData),
    null,
  );
  const field =
    "border-[1.5px] border-line-strong bg-panel px-3 py-1.5 text-fg placeholder:text-muted focus:border-cyan focus:outline-none";

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <label className="flex min-w-56 flex-1 flex-col gap-1">
        <span className="label-mono text-[10px] text-muted">{labels.email}</span>
        <input name="email" type="email" required className={field} placeholder="critico@email.com" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="label-mono text-[10px] text-muted">Cargo</span>
        <input name="title" maxLength={60} className={`${field} w-40`} placeholder="Editora de RPG" />
      </label>
      <select name="role" defaultValue="critic" className={field} aria-label="Papel">
        {roles.map((r) => (
          <option key={r} value={r}>
            {roleNames[r]}
          </option>
        ))}
      </select>
      <Button type="submit" disabled={pending}>
        {labels.setRole}
      </Button>
      {state && !state.ok && (
        <p role="alert" className="w-full text-[13px] text-red">
          {state.error === "self" ? labels.self : labels.notFound}
        </p>
      )}
    </form>
  );
}
