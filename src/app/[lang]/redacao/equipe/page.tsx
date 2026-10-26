import { Guard } from "@/components/newsroom/guard";
import { NewsroomPageHeader } from "@/components/newsroom/page-header";
import { RoleForm } from "@/components/newsroom/role-form";
import { getDictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import { listTeam } from "@/lib/newsroom/queries";

const roleColor: Record<string, string> = {
  admin: "text-brand",
  editor: "text-brand",
  critic: "text-cyan",
};

export default function TeamPage() {
  return (
    <Guard role="admin">
      {async () => {
        const [dict, team] = await Promise.all([getDictionary(), listTeam()]);
        const l = dict.newsroom.team;

        return (
          <>
            <NewsroomPageHeader title={l.title} lead={l.lead} />
            <RoleForm labels={l} roleNames={dict.roles} />
            <ul className="mt-8 divide-y divide-line">
              {team.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-fg">{m.name || m.email}</div>
                    <div className="truncate text-xs text-muted">{m.email}</div>
                  </div>
                  <div className="text-right">
                    <div className={cn("label-mono text-[11px]", roleColor[m.role])}>{dict.roles[m.role]}</div>
                    {m.title && <div className="text-xs text-muted">{m.title}</div>}
                  </div>
                </li>
              ))}
            </ul>
          </>
        );
      }}
    </Guard>
  );
}
