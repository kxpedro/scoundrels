import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ScoreHistogram } from "@/components/critic/score-histogram";
import { ScoreBadge } from "@/components/ui/score-badge";
import { path } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import { formatReleaseDate, initials } from "@/lib/format";
import { getCriticProfile } from "@/lib/queries/critics";

export async function generateMetadata({ params }: PageProps<"/[lang]/criticos/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  const data = await getCriticProfile(handle);
  return data ? { title: data.critic.name, description: data.critic.bio ?? undefined } : {};
}

export default function CriticPage(props: PageProps<"/[lang]/criticos/[handle]">) {
  return (
    <Suspense fallback={<div className="mt-6 h-64 animate-pulse bg-panel" aria-hidden />}>
      <CriticProfile params={props.params} />
    </Suspense>
  );
}

async function CriticProfile({ params }: Pick<PageProps<"/[lang]/criticos/[handle]">, "params">) {
  const { handle } = await params;
  const [data, lang, dict] = await Promise.all([getCriticProfile(handle), getLocale(), getDictionary()]);
  if (!data) notFound();

  const { critic, total, average, distribution, reviews } = data;
  const senior = critic.role === "editor" || critic.role === "admin";
  const roleLabel = critic.title ?? dict.roles[critic.role as keyof typeof dict.roles];

  return (
    <section className="pt-8">
      <header className="flex flex-wrap items-center gap-5">
        <span
          className={cn(
            "chamfer font-score flex size-16 shrink-0 items-center justify-center text-2xl font-bold",
            senior ? "bg-brand text-on-brand" : "bg-raised text-cyan",
          )}
          aria-hidden
        >
          {initials(critic.name)}
        </span>
        <div className="min-w-[220px] flex-1">
          <h1 className="font-display text-2xl text-fg uppercase sm:text-3xl">{critic.name}</h1>
          <p className={cn("label-mono text-xs", senior ? "text-brand" : "text-cyan")}>{roleLabel}</p>
          {critic.bio && <p className="mt-2 max-w-xl text-muted">{critic.bio}</p>}
        </div>
        <div className="flex gap-2">
          <Stat label={dict.critics.reviews} value={String(total)} />
          <Stat label={dict.critics.average} value={average === null ? "—" : average.toFixed(1)} highlight />
        </div>
      </header>

      {total > 0 && (
        <div className="mt-8 max-w-2xl">
          <ScoreHistogram distribution={distribution} label={dict.critics.howRates} />
        </div>
      )}

      <h2 className="font-display mt-10 mb-3 text-lg text-fg">{dict.critics.published}</h2>
      {reviews.length === 0 ? (
        <p className="text-muted">{dict.critics.none}</p>
      ) : (
        <ul className="divide-y divide-line">
          {reviews.map((r) => (
            <li key={r.slug}>
              <Link href={path(lang, `/reviews/${r.slug}`)} className="group flex items-center gap-3 py-3">
                <ScoreBadge variant="inline" kind="critic" value={r.score} className="shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-fg group-hover:text-brand">{r.title}</span>
                  <span className="label-mono block text-[10px] text-muted">
                    {r.game.title}
                    {r.publishedAt && ` · ${formatReleaseDate(r.publishedAt.toISOString().slice(0, 10))}`}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="chamfer bg-panel px-3 py-1.5">
      <div className="label-mono text-[10px] text-muted">{label}</div>
      <div className={cn("font-score text-2xl font-bold", highlight ? "text-brand" : "text-fg")}>{value}</div>
    </div>
  );
}
