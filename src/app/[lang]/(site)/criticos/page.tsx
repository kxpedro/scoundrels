import type { Metadata } from "next";
import Link from "next/link";
import { path } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";
import { listCritics } from "@/lib/queries/critics";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.critics.title, description: dict.critics.lead };
}

export default async function CriticsPage() {
  const [lang, dict, critics] = await Promise.all([getLocale(), getDictionary(), listCritics()]);

  return (
    <section className="pt-8">
      <h1 className="font-display text-3xl text-fg">{dict.critics.title}</h1>
      <p className="mt-2 text-muted">{dict.critics.lead}</p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {critics.map((c) => {
          const senior = c.role === "editor" || c.role === "admin";
          return (
            <li key={c.handle}>
              <Link href={path(lang, `/criticos/${c.handle}`)} className="chamfer lift-lg flex items-center gap-3 bg-panel p-3">
                <span
                  className={cn(
                    "chamfer-sm font-score flex size-11 shrink-0 items-center justify-center font-bold",
                    senior ? "bg-brand text-on-brand" : "bg-raised text-cyan",
                  )}
                  aria-hidden
                >
                  {initials(c.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-fg">{c.name}</span>
                  <span className={cn("label-mono block text-[11px]", senior ? "text-brand" : "text-cyan")}>
                    {c.title ?? dict.roles[c.role as keyof typeof dict.roles]}
                  </span>
                </span>
                <span className="text-right">
                  <span className="font-score block text-lg font-bold text-fg">{c.reviews}</span>
                  <span className="label-mono block text-[10px] text-muted">{dict.critics.reviews}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
