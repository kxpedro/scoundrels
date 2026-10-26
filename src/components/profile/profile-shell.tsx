import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/button";
import { path, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";
import { getUserProfile, isFollowing } from "@/lib/queries/social";
import { getSession } from "@/lib/session";
import { FollowButton } from "./follow-button";

export type ProfileTab = "reviews" | "zerados" | "jogando" | "quero-jogar" | "abandonados" | "listas";

type Profile = NonNullable<Awaited<ReturnType<typeof getUserProfile>>>;

/** Cabeçalho + abas do perfil (/u/<handle>/…). O conteúdo da aba vem como children. */
export async function ProfileShell({
  handle,
  active,
  lang,
  dict,
  children,
}: {
  handle: string;
  active: ProfileTab;
  lang: Locale;
  dict: Dictionary;
  children: (profile: Profile) => React.ReactNode;
}) {
  const profile = await getUserProfile(handle);
  if (!profile) notFound();
  const { user, statuses } = profile;
  const l = dict.profile;
  const base = path(lang, `/u/${handle}`);
  const staff = user.role !== "user";

  const tabs: Array<{ key: ProfileTab; href: string; n: number }> = [
    { key: "reviews", href: base, n: profile.reviews },
    { key: "zerados", href: `${base}/zerados`, n: statuses.finished },
    { key: "jogando", href: `${base}/jogando`, n: statuses.playing },
    { key: "quero-jogar", href: `${base}/quero-jogar`, n: statuses.wishlist },
    { key: "abandonados", href: `${base}/abandonados`, n: statuses.dropped },
    { key: "listas", href: `${base}/listas`, n: profile.lists },
  ];
  const stats = [
    { label: l.reviews, n: profile.reviews, accent: "" },
    { label: l.tabs.zerados, n: statuses.finished, accent: "border-t-2 border-cyan text-cyan" },
    { label: l.tabs.jogando, n: statuses.playing, accent: "border-t-2 border-amber text-amber" },
    { label: l.tabs["quero-jogar"], n: statuses.wishlist, accent: "" },
  ];

  return (
    <section className="pt-8">
      <header className="flex flex-wrap items-center gap-5">
        <span
          className={cn(
            "chamfer font-score flex size-16 shrink-0 items-center justify-center text-2xl font-bold",
            staff ? "bg-brand text-on-brand" : "bg-raised text-cyan",
          )}
          aria-hidden
        >
          {initials(user.name || handle)}
        </span>
        <div className="min-w-[200px] flex-1">
          <h1 className="font-display text-2xl text-fg sm:text-3xl">{user.name || handle}</h1>
          <p className="label-mono text-[11px] text-muted">
            @{handle}
            {staff && (
              <>
                {" · "}
                <Link href={path(lang, `/criticos/${handle}`)} className="text-brand hover:underline">
                  {user.title ?? dict.roles[user.role as keyof typeof dict.roles]}
                </Link>
              </>
            )}
          </p>
          {user.bio && <p className="mt-1.5 max-w-xl text-muted">{user.bio}</p>}
          <p className="label-mono mt-1.5 text-[11px] text-label">
            <span className="text-fg">{profile.followers}</span> {l.followers} · <span className="text-fg">{profile.following}</span>{" "}
            {l.followingCount}
          </p>
        </div>
        <Suspense fallback={null}>
          <FollowArea targetId={user.id} handle={handle} lang={lang} dict={dict} />
        </Suspense>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={cn("chamfer bg-panel px-3 py-1.5", s.accent)}>
            <div className={cn("label-mono text-[10px]", s.accent ? "" : "text-muted")}>{s.label}</div>
            <div className="font-score text-xl font-bold text-fg">{s.n}</div>
          </div>
        ))}
      </div>

      <nav aria-label={l.reviews} className="mt-6 mb-5 flex gap-5 overflow-x-auto border-b border-line text-[13px]">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={active === tab.key ? "page" : undefined}
            className={cn(
              "shrink-0 border-b-2 py-2",
              active === tab.key ? "border-brand text-fg" : "border-transparent text-muted hover:text-fg",
            )}
          >
            {l.tabs[tab.key]} <span className="font-score text-[11px] text-muted">{tab.n}</span>
          </Link>
        ))}
      </nav>

      {children(profile)}
    </section>
  );
}

async function FollowArea({ targetId, handle, lang, dict }: { targetId: string; handle: string; lang: Locale; dict: Dictionary }) {
  const session = await getSession();
  if (session?.user.id === targetId) {
    return <ButtonLink href={path(lang, "/conta")}>{dict.profile.edit}</ButtonLink>;
  }
  const following = session ? await isFollowing(session.user.id, targetId) : false;
  return (
    <FollowButton
      targetId={targetId}
      initial={following}
      signedIn={Boolean(session)}
      loginHref={`${path(lang, "/entrar")}?next=${encodeURIComponent(path(lang, `/u/${handle}`))}`}
      labels={{ follow: dict.profile.follow, following: dict.profile.following }}
    />
  );
}
