import type { Metadata } from "next";
import { Suspense } from "react";
import { getDictionary } from "@/i18n/dictionaries";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Redação", robots: { index: false } };

export default function NewsroomPage() {
  return (
    <Suspense fallback={<p className="label-mono py-16 text-muted">&gt; autenticando_</p>}>
      <Newsroom />
    </Suspense>
  );
}

async function Newsroom() {
  const session = await requireRole("critic");
  const dict = await getDictionary();

  return (
    <section className="py-16">
      <p className="label-mono text-[13px] text-cyan">&gt; {session.user.name || session.user.email} · {session.user.role}</p>
      <h1 className="font-display mt-2 text-3xl text-fg uppercase">{dict.newsroom.title}</h1>
      <p className="mt-3 max-w-xl text-muted">{dict.newsroom.lead}</p>
    </section>
  );
}
