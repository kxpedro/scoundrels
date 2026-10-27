import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { and, eq } from "drizzle-orm";
import { AccountForm } from "@/components/account/account-form";
import { ChangePasswordForm } from "@/components/account/change-password-form";
import { db } from "@/db";
import { account } from "@/db/schema";
import { path } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { ensureHandle } from "@/lib/newsroom/handles";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { robots: { index: false } };

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="mt-8 h-72 max-w-lg animate-pulse bg-panel" aria-hidden />}>
      <Account />
    </Suspense>
  );
}

async function Account() {
  const [session, lang, dict] = await Promise.all([getSession(), getLocale(), getDictionary()]);
  if (!session) redirect(`${path(lang, "/entrar")}?next=${encodeURIComponent(path(lang, "/conta"))}`);
  const handle = session.user.handle ?? (await ensureHandle(session.user.id));
  // Só quem entra com e-mail e senha tem senha para trocar.
  const [credential] = await db
    .select({ id: account.id })
    .from(account)
    .where(and(eq(account.userId, session.user.id), eq(account.providerId, "credential")))
    .limit(1);
  const hasPassword = Boolean(credential);

  return (
    <section className="pt-8">
      <h1 className="font-display text-2xl text-fg sm:text-3xl">{dict.account.title}</h1>
      <p className="mt-1 mb-8 text-muted">{dict.account.lead}</p>
      <AccountForm
        lang={lang}
        labels={dict.account}
        errors={dict.social.errors}
        initial={{ name: session.user.name ?? "", handle, bio: session.user.bio ?? "" }}
      />
      {hasPassword && (
        <div className="mt-12 border-t border-line pt-8">
          <ChangePasswordForm required={Boolean(session.user.mustChangePassword)} labels={dict.passwordChange} errors={dict.newsroom.users.errors} />
        </div>
      )}
    </section>
  );
}
