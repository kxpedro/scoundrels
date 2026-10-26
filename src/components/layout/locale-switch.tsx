"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";

/** Troca só o prefixo de idioma, mantendo a página atual. */
export function LocaleSwitch({ current }: { current: Locale }) {
  const pathname = usePathname();
  const rest = pathname.replace(/^\/(pt|en)(?=\/|$)/, "");

  return (
    <span className="label-mono flex gap-1.5 text-[11px]">
      {locales.map((l, i) => (
        <span key={l} className="flex gap-1.5">
          {i > 0 && <span className="text-muted">/</span>}
          <Link
            href={`/${l}${rest}`}
            hrefLang={l}
            aria-current={l === current ? "true" : undefined}
            className={cn(l === current ? "text-fg" : "text-muted hover:text-brand")}
          >
            {l.toUpperCase()}
          </Link>
        </span>
      ))}
    </span>
  );
}
