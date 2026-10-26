import Link from "next/link";
import { path } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";

export async function SiteFooter() {
  const lang = await getLocale();
  const dict = await getDictionary();

  return (
    <footer className="label-mono mt-16 border-t border-line text-[11px] text-muted">
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 py-4 sm:px-6">
        <span>SCOUNDRELS © 2026</span>
        <span className="flex gap-2">
          <Link href={path(lang, "/sobre")} className="link-hot">{dict.footer.about}</Link>·
          <Link href={path(lang, "/politica")} className="link-hot">{dict.footer.policy}</Link>·
          <Link href={path(lang, "/contato")} className="link-hot">{dict.footer.contact}</Link>
        </span>
      </div>
    </footer>
  );
}
