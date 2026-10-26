import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatScore, scoreTone, type ScoreKind, type ScoreTone } from "@/lib/score";

const solid: Record<ScoreTone, string> = {
  brand: "bg-brand text-on-brand",
  cyan: "bg-cyan text-on-cyan",
  amber: "bg-amber text-on-amber",
  red: "bg-red text-on-red",
};
const text: Record<ScoreTone, string> = {
  brand: "text-brand",
  cyan: "text-cyan",
  amber: "text-amber",
  red: "text-red",
};
const fill: Record<ScoreTone, string> = {
  brand: "bg-brand",
  cyan: "bg-cyan",
  amber: "bg-amber",
  red: "bg-red",
};
const borderTop: Record<ScoreTone, string> = {
  brand: "border-t-brand",
  cyan: "border-t-cyan",
  amber: "border-t-amber",
  red: "border-t-red",
};
const borderLeft: Record<ScoreTone, string> = {
  brand: "border-l-brand",
  cyan: "border-l-cyan",
  amber: "border-l-amber",
  red: "border-l-red",
};

type Props = {
  value: number | null;
  kind: ScoreKind;
  variant: "hero" | "card" | "list" | "inline";
  /** Rótulo do hero ("SCOUNDREL"/"PÚBLICO") e legenda de contagem. */
  label?: string;
  caption?: string;
  href?: string;
  className?: string;
  /** Só para a variante inline: "lg" no destaque da home. */
  size?: "md" | "lg";
};

function Meter({ value, bar, track }: { value: number; bar: string; track: string }) {
  return (
    <span className={cn("block h-1", track)} aria-hidden>
      <span className={cn("block h-full", bar)} style={{ width: `${value * 10}%` }} />
    </span>
  );
}

export function ScoreBadge({ value, kind, variant, label, caption, href, className, size = "md" }: Props) {
  const empty = value === null;
  const tone = empty ? "cyan" : scoreTone(value, kind);
  const shown = empty ? "—" : formatScore(value, { average: variant === "hero" || variant === "card" });
  const aria = empty ? `${label ?? ""} sem nota` : `${label ?? ""} ${shown} de 10`;

  let body: React.ReactNode;

  if (variant === "hero") {
    const critic = kind === "critic";
    body = (
      <span
        className={cn(
          "chamfer flex min-w-24 flex-col px-4 py-2",
          critic ? solid.brand : cn("border-l-3 bg-panel", borderLeft[tone]),
        )}
      >
        <span className={cn("label-mono text-xs", critic ? "text-on-brand" : "text-cyan")}>{label}</span>
        <span className={cn("font-score text-4xl leading-none font-bold", !critic && "text-fg")}>{shown}</span>
        {caption && <span className={cn("mt-0.5 text-[11px]", !critic && "text-muted")}>{caption}</span>}
      </span>
    );
  } else if (variant === "card") {
    const critic = kind === "critic";
    body = (
      <span
        className={cn(
          "chamfer-sm inline-flex items-stretch",
          critic ? solid.brand : cn("border-l-2 bg-ink", borderLeft[tone], text[tone]),
        )}
      >
        <span className={cn("label-mono flex items-center px-1.5 text-[10px]", critic ? "bg-on-brand text-brand" : "text-label")}>
          {critic ? "SCD" : "PUB"}
        </span>
        <span className="flex flex-col">
          <span className="font-score px-2 pt-px text-[17px] leading-tight font-bold">{shown}</span>
          {!empty && (
            <span className="mx-2 mb-1">
              <Meter
                value={value}
                bar={critic ? "bg-on-brand" : fill[tone]}
                track={critic ? "bg-on-brand/25" : "bg-raised"}
              />
            </span>
          )}
        </span>
      </span>
    );
  } else if (variant === "list") {
    body = (
      <span className={cn("chamfer-sm flex w-16 flex-col items-center border-t-3 bg-panel pt-1.5", borderTop[tone])}>
        <span className={cn("font-score text-[28px] leading-none font-bold", text[tone])}>{shown}</span>
        <span className="font-mono mt-0.5 mb-1.5 text-[10px] text-muted">/10</span>
        {!empty && (
          <span className="w-full">
            <Meter value={value} bar={fill[tone]} track="bg-raised" />
          </span>
        )}
      </span>
    );
  } else {
    body = (
      <span
        className={cn(
          "font-score inline-block font-bold",
          size === "lg" ? "chamfer px-3.5 py-1 text-3xl" : "chamfer-sm px-2.5 py-0.5 text-lg",
          solid[tone],
        )}
      >
        {shown}
      </span>
    );
  }

  if (href) {
    return (
      <Link href={href} aria-label={aria} className={cn("lift-lg inline-block", className)}>
        {body}
      </Link>
    );
  }
  return (
    <span role="img" aria-label={aria} className={cn("inline-block", className)}>
      {body}
    </span>
  );
}
