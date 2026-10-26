import type { CriticReviewStatus } from "@/db/schema";
import { cn } from "@/lib/cn";

/** Cores do fluxo editorial: rascunho neutro, revisão âmbar, ajustes magenta, publicada ciano. */
export const statusStyle: Record<CriticReviewStatus, { tag: string; text: string; border: string }> = {
  draft: { tag: "bg-raised text-label", text: "text-label", border: "border-t-line-strong" },
  in_review: { tag: "bg-amber/15 text-amber", text: "text-amber", border: "border-t-amber" },
  changes_requested: { tag: "bg-magenta/15 text-magenta", text: "text-magenta", border: "border-t-magenta" },
  published: { tag: "bg-cyan/15 text-cyan", text: "text-cyan", border: "border-t-cyan" },
  archived: { tag: "bg-raised text-muted", text: "text-muted", border: "border-t-line" },
};

export function StatusTag({ status, label }: { status: CriticReviewStatus; label: string }) {
  return <span className={cn("label-mono inline-block px-1.5 py-px text-[10px]", statusStyle[status].tag)}>{label}</span>;
}
