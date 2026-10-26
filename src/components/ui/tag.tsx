import Link from "next/link";
import { cn } from "@/lib/cn";

export type TagVariant = "genre" | "neutral" | "platform" | "cyan" | "amber" | "red" | "label";

const variants: Record<TagVariant, string> = {
  genre: "label-mono bg-magenta text-on-magenta px-2.5 py-0.5 text-[13px]",
  neutral: "label-mono bg-raised text-fg px-2.5 py-0.5 text-[13px]",
  platform: "font-score font-bold uppercase border-[1.5px] border-cyan text-cyan px-2 py-px text-xs hover:bg-cyan hover:text-on-cyan",
  cyan: "label-mono bg-cyan/15 text-cyan px-1.5 py-px text-[11px]",
  amber: "label-mono bg-amber/15 text-amber px-1.5 py-px text-[11px]",
  red: "label-mono bg-red/15 text-red px-1.5 py-px text-[11px]",
  label: "label-mono bg-raised text-label px-1.5 py-px text-[11px]",
};

/** Toda tag é um link (ver "Tudo é clicável" no design system). */
export function Tag({
  href,
  variant,
  children,
  className,
}: {
  href: string;
  variant: TagVariant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("lift inline-flex items-center gap-1", variants[variant], className)}>
      {children}
    </Link>
  );
}
