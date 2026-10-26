import Link from "next/link";
import { path } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";

/** Tela de erro autônoma (pode renderizar fora do layout do site, ex.: 403 na redação). */
export async function ErrorScreen({
  code,
  title,
  lead,
  action,
}: {
  code: string;
  title: string;
  lead?: string;
  action?: { href: string; label: string };
}) {
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);
  const link = action ?? { href: path(lang, "/"), label: dict.errors.back };

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
      <Link href={path(lang, "/")} className="font-display glitch text-xl text-brand">
        SCOUNDRELS
      </Link>
      <p className="font-score glitch mt-16 text-7xl font-bold text-brand">{code}</p>
      <h1 className="font-display mt-4 text-2xl text-fg uppercase">{title}</h1>
      {lead && <p className="mt-2 text-muted">{lead}</p>}
      <Link href={link.href} className="link-hot mt-6 inline-block text-cyan">
        {link.label} →
      </Link>
    </section>
  );
}
