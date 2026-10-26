import Link from "next/link";

export function SectionHeader({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-3.5 flex items-baseline justify-between gap-4">
      <h2 className="font-display text-lg text-fg">{title}</h2>
      {href && linkLabel && (
        <Link href={href} className="link-hot text-[13px] text-cyan">
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}
