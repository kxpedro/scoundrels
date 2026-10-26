import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FollowButton } from "@/components/profile/follow-button";
import { RelativeTime } from "@/components/ui/relative-time";
import { ScoreBadge } from "@/components/ui/score-badge";
import { path, type Locale } from "@/i18n/config";
import { getDictionary, getLocale, t, type Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";
import { getFeed, getFollowSuggestions, type FeedFilter, type FeedItem } from "@/lib/queries/social";
import { getSession } from "@/lib/session";

const filters: FeedFilter[] = ["todos", "criticos", "jogadores"];

export const metadata: Metadata = { title: "Feed", robots: { index: false } };

export default function FeedPage(props: PageProps<"/[lang]/feed">) {
  return (
    <Suspense fallback={<div className="mt-8 h-72 animate-pulse bg-panel" aria-hidden />}>
      <Feed searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Feed({ searchParams }: Pick<PageProps<"/[lang]/feed">, "searchParams">) {
  const [sp, session, lang, dict] = await Promise.all([searchParams, getSession(), getLocale(), getDictionary()]);
  if (!session) redirect(`${path(lang, "/entrar")}?next=${encodeURIComponent(path(lang, "/feed"))}`);

  const filter = filters.find((f) => f === sp.filtro) ?? "todos";
  const items = await getFeed(session.user.id, filter);
  const l = dict.feed;

  return (
    <section className="max-w-3xl pt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-2xl text-fg sm:text-3xl">{l.title}</h1>
        <nav className="label-mono flex gap-3 text-[11px]" aria-label={l.title}>
          {filters.map((f) => (
            <Link
              key={f}
              href={f === "todos" ? path(lang, "/feed") : `${path(lang, "/feed")}?filtro=${f}`}
              aria-current={filter === f ? "true" : undefined}
              className={cn(filter === f ? "text-brand" : "text-label hover:text-fg")}
            >
              {l.tabs[f]}
            </Link>
          ))}
        </nav>
      </div>

      {items.length === 0 ? (
        <Suggestions viewerId={session.user.id} lang={lang} dict={dict} />
      ) : (
        <ul className="mt-6 divide-y divide-line">
          {items.map((item, i) => (
            <FeedRow key={`${item.kind}-${i}`} item={item} lang={lang} dict={dict} />
          ))}
        </ul>
      )}
    </section>
  );
}

function FeedRow({ item, lang, dict }: { item: FeedItem; lang: Locale; dict: Dictionary }) {
  const l = dict.feed;
  const staff = item.actor.role !== "user";
  const handle = item.actor.handle ?? "";
  const actorHref = staff ? path(lang, `/criticos/${handle}`) : path(lang, `/u/${handle}`);

  let verb: string;
  let object: React.ReactNode;
  let detail: string | null = null;
  let side: React.ReactNode = null;

  switch (item.kind) {
    case "critic":
      verb = l.critic;
      object = <Link href={path(lang, `/jogos/${item.game.slug}`)} className="text-fg hover:text-brand">{item.game.title}</Link>;
      detail = `“${item.title}”`;
      side = <ScoreBadge variant="inline" kind="critic" value={item.score} href={path(lang, `/reviews/${item.slug}`)} />;
      break;
    case "review":
      verb = l.review;
      object = <Link href={path(lang, `/jogos/${item.game.slug}/publico`)} className="text-fg hover:text-brand">{item.game.title}</Link>;
      detail = item.body ? `“${item.body.slice(0, 140)}${item.body.length > 140 ? "…" : ""}”` : null;
      side = <ScoreBadge variant="inline" kind="user" value={item.score} />;
      break;
    case "status":
      verb = item.status === "finished" ? l.finished : l.playing;
      object = <Link href={path(lang, `/jogos/${item.game.slug}`)} className="text-fg hover:text-brand">{item.game.title}</Link>;
      side = (
        <span className={cn("label-mono px-1.5 py-px text-[10px]", item.status === "finished" ? "bg-cyan/15 text-cyan" : "bg-amber/15 text-amber")}>
          {dict.playStatus[item.status]}
        </span>
      );
      break;
    case "list":
      verb = l.list;
      object = <Link href={path(lang, `/u/${handle}/listas/${item.slug}`)} className="text-magenta hover:underline">{item.title}</Link>;
      break;
  }

  return (
    <li className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 py-3">
      <Link
        href={actorHref}
        aria-hidden
        tabIndex={-1}
        className={cn(
          "chamfer-sm font-score flex size-9 items-center justify-center text-xs font-bold",
          staff ? "bg-brand text-on-brand" : "bg-raised text-cyan",
        )}
      >
        {initials(item.actor.name || handle)}
      </Link>
      <div className="min-w-0">
        <p>
          <Link href={actorHref} className="font-medium text-fg hover:text-brand">
            {item.actor.name || handle}
          </Link>{" "}
          <span className="text-muted">{verb}</span> {object}
        </p>
        <p className="truncate text-xs text-muted">
          {detail && <>{detail} · </>}
          <RelativeTime date={item.at} labels={dict.time} />
        </p>
      </div>
      <div className="justify-self-end">{side}</div>
    </li>
  );
}

async function Suggestions({ viewerId, lang, dict }: { viewerId: string; lang: Locale; dict: Dictionary }) {
  const people = await getFollowSuggestions(viewerId);
  return (
    <div className="mt-8">
      <p className="text-muted">{dict.feed.empty}</p>
      {people.length > 0 && (
        <>
          <h2 className="label-mono mt-8 mb-3 text-[11px] text-cyan">{dict.feed.suggestions}</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {people.map((p) => {
              const staff = p.role !== "user";
              return (
                <li key={p.id} className="chamfer flex items-center gap-3 bg-panel p-3">
                  <Link href={path(lang, `/u/${p.handle}`)} className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-fg">{p.name || p.handle}</span>
                    <span className={cn("label-mono block text-[10px]", staff ? "text-brand" : "text-muted")}>
                      {staff ? (p.title ?? dict.roles[p.role as keyof typeof dict.roles]) : t(dict.feed.reviewsCount, { n: p.reviews })}
                    </span>
                  </Link>
                  <FollowButton
                    targetId={p.id}
                    initial={false}
                    signedIn
                    loginHref={path(lang, "/entrar")}
                    labels={{ follow: dict.profile.follow, following: dict.profile.following }}
                  />
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
