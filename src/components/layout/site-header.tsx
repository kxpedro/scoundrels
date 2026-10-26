import Link from "next/link";
import { Suspense } from "react";
import { path } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { LocaleSwitch } from "./locale-switch";
import { UserMenu } from "./user-menu";

export async function SiteHeader() {
  const lang = await getLocale();
  const dict = await getDictionary();

  const nav = [
    { href: "/jogos", label: dict.nav.games },
    { href: "/reviews", label: dict.nav.reviews },
    { href: "/criticos", label: dict.nav.critics },
    { href: "/listas", label: dict.nav.lists },
  ];

  return (
    <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4 sm:px-6">
      <Link href={path(lang, "/")} className="font-display glitch text-xl text-brand">
        SCOUNDRELS
      </Link>

      <nav aria-label="Principal" className="order-last flex w-full gap-5 text-[13px] sm:order-none sm:w-auto">
        {nav.map((item) => (
          <Link key={item.href} href={path(lang, item.href)} className="link-hot">
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-4 text-[13px]">
        <Link href={path(lang, "/busca")} aria-label={dict.nav.search} className="link-hot">
          <SearchIcon />
        </Link>
        {/* usePathname é dado de URL em rotas dinâmicas → boundary próprio. */}
        <Suspense fallback={<span className="label-mono text-[11px] text-muted">PT / EN</span>}>
          <LocaleSwitch current={lang} />
        </Suspense>
        <Suspense fallback={<span className="chamfer-sm block size-8 bg-raised" />}>
          <UserMenu />
        </Suspense>
      </div>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
