"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function NavLink({
  href,
  exact = false,
  badge,
  badgeClass,
  children,
}: {
  href: string;
  exact?: boolean;
  badge?: number;
  badgeClass?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center justify-between border-l-2 px-2.5 py-1.5 text-[13px] transition-colors",
        active ? "border-brand bg-raised text-fg" : "border-transparent hover:text-fg",
      )}
    >
      {children}
      {badge ? <span className={cn("font-score font-bold", badgeClass)}>{badge}</span> : null}
    </Link>
  );
}
