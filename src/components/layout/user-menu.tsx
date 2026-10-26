import Link from "next/link";
import { path } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
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
  // Contas criadas por magic link chegam sem nome até o onboarding.
  const initials = (user.name || user.email).slice(0, 2).toUpperCase();

  return (
    <span className="flex items-center gap-3">
      {hasRole(user.role, "critic") && (
        <Link href={path(lang, "/redacao")} className="label-mono text-[11px] text-brand hover:underline">
          {dict.nav.newsroom}
        </Link>
      )}
      <Link
        href={path(lang, `/u/${user.handle ?? user.id}`)}
        aria-label={dict.nav.profile}
        className="chamfer-sm font-score flex size-8 items-center justify-center bg-raised text-xs font-bold text-cyan"
      >
        {initials}
      </Link>
      <SignOutButton label={dict.nav.signOut} />
    </span>
  );
}
