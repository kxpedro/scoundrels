import Link from "next/link";
import { path } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { initials } from "@/lib/format";
import { getSession, hasRole } from "@/lib/session";
import { SignOutButton } from "./sign-out-button";

/** Lê a sessão (runtime) — renderizado sob <Suspense> no cabeçalho. */
export async function UserMenu() {
  const [session, lang, dict] = await Promise.all([getSession(), getLocale(), getDictionary()]);

  if (!session) {
    return (
      <Link href={path(lang, "/entrar")} className="font-score bg-brand px-3 py-1.5 font-bold text-on-brand hover:bg-fg">
        {dict.nav.signIn}
      </Link>
    );
  }

  const { user } = session;
  // Sem @ ainda (conta nova por magic link): o avatar leva à página de conta, onde ele é criado.
  const profileHref = user.handle ? path(lang, `/u/${user.handle}`) : path(lang, "/conta");

  return (
    <span className="flex items-center gap-3">
      <Link href={path(lang, "/feed")} className="label-mono text-[11px] text-cyan hover:underline">
        {dict.nav.feed}
      </Link>
      {hasRole(user.role, "critic") && (
        <Link href={path(lang, "/redacao")} className="label-mono text-[11px] text-brand hover:underline">
          {dict.nav.newsroom}
        </Link>
      )}
      <Link
        href={profileHref}
        aria-label={dict.nav.profile}
        title={dict.nav.profile}
        className="chamfer-sm font-score flex size-8 items-center justify-center bg-raised text-xs font-bold text-cyan"
      >
        {initials(user.name || user.email)}
      </Link>
      <Link href={path(lang, "/conta")} aria-label={dict.nav.account} title={dict.nav.account} className="text-muted hover:text-fg">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
        </svg>
      </Link>
      <SignOutButton label={dict.nav.signOut} />
    </span>
  );
}
