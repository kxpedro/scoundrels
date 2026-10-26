"use client";

import type { Dictionary } from "@/i18n/dictionaries";
import { formatRelative } from "@/lib/format";

/** Calculado no cliente: o "agora" não pode entrar no HTML prerenderizado/cacheado. */
export function RelativeTime({ date, labels, className }: { date: Date | string; labels: Dictionary["time"]; className?: string }) {
  const iso = new Date(date).toISOString();
  return (
    <time dateTime={iso} title={iso.slice(0, 10)} className={className} suppressHydrationWarning>
      {formatRelative(iso, labels, new Date())}
    </time>
  );
}
