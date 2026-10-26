import Link from "next/link";
import { path } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";

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
    <section className="py-24">
      <p className="font-score glitch text-7xl font-bold text-brand">{code}</p>
      <h1 className="font-display mt-4 text-2xl text-fg uppercase">{title}</h1>
      {lead && <p className="mt-2 text-muted">{lead}</p>}
      <Link href={link.href} className="link-hot mt-6 inline-block text-cyan">
        {link.label} →
      </Link>
    </section>
  );
}
