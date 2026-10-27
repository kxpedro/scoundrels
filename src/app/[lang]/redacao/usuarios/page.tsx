import Link from "next/link";
import { NewUserForm } from "@/components/admin/new-user-form";
import { UserRow } from "@/components/admin/user-row";
import { Guard } from "@/components/newsroom/guard";
import { NewsroomPageHeader } from "@/components/newsroom/page-header";
import { path } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { getUserStats, listUsersForAdmin, userFilters, type UserFilter } from "@/lib/admin/queries";
import { cn } from "@/lib/cn";
import { formatReleaseDate } from "@/lib/format";

export default function UsersPage(props: PageProps<"/[lang]/redacao/usuarios">) {
  return (
    <Guard role="admin">
      {async (session) => {
        const sp = await props.searchParams;
        const term = typeof sp.q === "string" ? sp.q : "";
        const filter = userFilters.find((f) => f === sp.filtro) ?? "todos";
        const [lang, dict, stats, rows] = await Promise.all([
          getLocale(),
          getDictionary(),
          getUserStats(),
          listUsersForAdmin({ term, filter }),
        ]);
        const l = dict.newsroom.users;
        const base = path(lang, "/redacao/usuarios");
        const href = (f: UserFilter) => {
          const qs = new URLSearchParams();
          if (f !== "todos") qs.set("filtro", f);
          if (term) qs.set("q", term);
          const s = qs.toString();
          return s ? `${base}?${s}` : base;
        };

        const cards = [
          { label: l.stats.total, n: stats.total, accent: "" },
          { label: l.stats.staff, n: stats.staff, accent: "border-t-2 border-brand text-brand" },
          { label: l.stats.recent, n: stats.recent, accent: "border-t-2 border-cyan text-cyan" },
          { label: l.stats.suspended, n: stats.suspended, accent: "border-t-2 border-red text-red" },
        ];

        return (
          <>
            <NewsroomPageHeader title={l.title} lead={l.lead} />
            <div className="mb-6">
              <NewUserForm labels={l} roleNames={dict.roles} />
            </div>

            <div className="mb-5 grid grid-cols-2 gap-2 lg:grid-cols-4">
              {cards.map((c) => (
                <div key={c.label} className={cn("chamfer bg-panel px-3 py-2", c.accent)}>
                  <div className={cn("label-mono text-[10px]", c.accent ? "" : "text-muted")}>{c.label}</div>
                  <div className="font-score text-2xl font-bold text-fg">{c.n}</div>
                </div>
              ))}
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2">
              <form role="search" className="flex gap-1.5">
                {filter !== "todos" && <input type="hidden" name="filtro" value={filter} />}
                <input
                  name="q"
                  defaultValue={term}
                  placeholder={l.search}
                  aria-label={l.search}
                  className="w-64 border-[1.5px] border-line-strong bg-panel px-2.5 py-1 text-[13px] text-fg placeholder:text-muted focus:border-cyan focus:outline-none"
                />
              </form>
              <nav className="label-mono flex flex-wrap gap-3 text-[11px]" aria-label={l.title}>
                {userFilters.map((f) => (
                  <Link
                    key={f}
                    href={href(f)}
                    aria-current={filter === f ? "page" : undefined}
                    className={cn(filter === f ? "text-brand" : "text-label hover:text-fg")}
                  >
                    {l.filters[f]}
                  </Link>
                ))}
              </nav>
            </div>

            {rows.length === 0 ? (
              <p className="py-6 text-muted">{l.empty}</p>
            ) : (
              <ul>
                {rows.map((u) => (
                  <UserRow
                    key={`${u.id}:${u.role}:${u.bannedAt ? 1 : 0}`}
                    isSelf={u.id === session.user.id}
                    labels={l}
                    roleNames={dict.roles}
                    u={{
                      ...u,
                      createdAt: formatReleaseDate(u.createdAt.toISOString().slice(0, 10)),
                      bannedAt: u.bannedAt?.toISOString() ?? null,
                    }}
                  />
                ))}
              </ul>
            )}
          </>
        );
      }}
    </Guard>
  );
}
