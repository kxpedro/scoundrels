import Link from "next/link";
import { cn } from "@/lib/cn";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function CriticByline({
  href,
  name,
  roleLabel,
  highlight = false,
}: {
  href: string;
  name: string;
  roleLabel: string;
  /** Editor-chefe e editores ganham amarelo; críticos, ciano. */
  highlight?: boolean;
}) {
  return (
    <Link href={href} className="group flex items-center gap-2.5">
      <span
        className={cn(
          "chamfer-sm font-score flex size-9 shrink-0 items-center justify-center text-[13px] font-bold",
          highlight ? "bg-brand text-on-brand" : "bg-raised text-cyan",
        )}
        aria-hidden
      >
        {initials(name)}
      </span>
      <span className="leading-tight">
        <span className="block text-[15px] font-medium text-fg group-hover:text-brand group-hover:underline group-hover:underline-offset-3">
          {name}
        </span>
        <span className={cn("label-mono block text-xs", highlight ? "text-brand" : "text-cyan")}>{roleLabel}</span>
      </span>
    </Link>
  );
}
