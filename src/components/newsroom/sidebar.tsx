import Link from "next/link";
import { path } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { getSidebarCounts } from "@/lib/newsroom/queries";
import { getSession, hasRole } from "@/lib/session";
import { NavLink } from "./nav-link";

/** Barra lateral da redação (opção A — "Mesa de redação"). Itens variam por papel. */
export async function NewsroomSidebar() {
  const [session, lang, dict] = await Promise.all([getSession(), getLocale(), getDictionary()]);
  // Sem permissão a página mostra 401/403; a moldura fica vazia.
  if (!session || !hasRole(session.user.role, "critic")) return null;

  const { user } = session;
  const nr = dict.newsroom;
  const base = path(lang, "/redacao");
  const editor = hasRole(user.role, "editor");
  const counts = await getSidebarCounts({ id: user.id, role: user.role });
  const roleLabel = user.title ?? dict.roles[user.role as keyof typeof dict.roles] ?? user.role;

  return (
    <aside className="flex flex-col border-b border-line bg-[#100e18] px-3 py-4 md:min-h-dvh md:border-r md:border-b-0">
      <Link href={path(lang, "/")} className="font-display glitch px-2.5 text-base text-brand">
        SCOUNDRELS
      </Link>
      <span className="label-mono mb-5 px-2.5 text-[10px] text-cyan">{nr.title}</span>

      <nav aria-label={nr.title} className="flex flex-col gap-0.5">
        <NavLink href={base} exact>
          {nr.nav.dashboard}
        </NavLink>
        <NavLink href={`${base}/minhas`}>{nr.nav.mine}</NavLink>
        {editor && (
          <>
            <NavLink href={`${base}/fila`} badge={counts.queue} badgeClass="text-amber">
              {nr.nav.queue}
            </NavLink>
            <NavLink href={`${base}/jogos`}>{nr.nav.games}</NavLink>
            <NavLink href={`${base}/denuncias`} badge={counts.reports} badgeClass="text-red">
              {nr.nav.reports}
            </NavLink>
          </>
        )}
        {hasRole(user.role, "admin") && <NavLink href={`${base}/usuarios`}>{nr.nav.users}</NavLink>}
      </nav>

      <div className="mt-6 border-t border-line px-2.5 pt-3 md:mt-auto">
        <div className="truncate font-medium text-fg">{user.name || user.email}</div>
        <div className="label-mono text-[10px] text-brand">{roleLabel}</div>
        <Link href={path(lang, "/")} className="link-hot mt-3 inline-block text-xs text-muted">
          ← {nr.nav.backToSite}
        </Link>
      </div>
    </aside>
  );
}
