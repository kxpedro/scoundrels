import type { Dictionary } from "@/i18n/dictionaries";
import { t } from "@/i18n/interpolate";

/** "2026-03-14" → "14.03.2026" */
export function formatReleaseDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

/** Tempo relativo curto para metadados ("2d", "3sem"). Use via <RelativeTime> (depende do relógio). */
export function formatRelative(date: Date | string, labels: Dictionary["time"], now: Date): string {
  const days = Math.floor((now.getTime() - new Date(date).getTime()) / 86_400_000);
  if (days < 1) return labels.today;
  if (days < 7) return t(labels.days, { n: days });
  if (days < 30) return t(labels.weeks, { n: Math.floor(days / 7) });
  return t(labels.months, { n: Math.floor(days / 30) });
}

export function formatCount(n: number, lang: string): string {
  return n.toLocaleString(lang === "pt" ? "pt-BR" : "en-US");
}
