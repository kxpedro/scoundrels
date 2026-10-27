import type { Metadata } from "next";
import { Suspense } from "react";
import { getDictionary } from "@/i18n/dictionaries";
import { enabledProviders } from "@/lib/auth";
import { SignInForm } from "./sign-in-form";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.auth.title, robots: { index: false } };
}

export default async function SignInPage() {
  const dict = await getDictionary();

  return (
    <section className="mx-auto max-w-sm py-16">
      <h1 className="font-display text-2xl text-fg uppercase">{dict.auth.title}</h1>
      <p className="mt-2 mb-8 text-muted">{dict.auth.lead}</p>
      {/* useSearchParams (?next=) é runtime → precisa de boundary. */}
      <Suspense>
        <SignInForm providers={enabledProviders} labels={dict.auth} tabs={dict.authTabs} passwordLabels={dict.authPassword} />
      </Suspense>
    </section>
  );
}
