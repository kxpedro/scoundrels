import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProfileGameGrid } from "@/components/profile/game-grid";
import { ProfileShell, type ProfileTab } from "@/components/profile/profile-shell";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { listUserGames } from "@/lib/queries/social";
import { statusFromSlug } from "@/lib/social/constants";

export async function generateMetadata({ params }: PageProps<"/[lang]/u/[handle]/[status]">): Promise<Metadata> {
  const { handle, status } = await params;
  const dict = await getDictionary();
  const label = dict.profile.tabs[status as keyof typeof dict.profile.tabs];
  return label ? { title: `${label} · @${handle}` } : {};
}

export default function ProfileStatusPage(props: PageProps<"/[lang]/u/[handle]/[status]">) {
  return (
    <Suspense fallback={<div className="mt-8 h-72 animate-pulse bg-panel" aria-hidden />}>
      <Content params={props.params} />
    </Suspense>
  );
}

async function Content({ params }: Pick<PageProps<"/[lang]/u/[handle]/[status]">, "params">) {
  const [{ handle, status: slug }, lang, dict] = await Promise.all([params, getLocale(), getDictionary()]);
  const status = statusFromSlug(slug);
  if (!status) notFound();

  return (
    <ProfileShell handle={handle} active={slug as ProfileTab} lang={lang} dict={dict}>
      {async ({ user }) => {
        const games = await listUserGames(user.id, status);
        if (!games.length) return <p className="text-muted">{dict.profile.emptyGames}</p>;
        return <ProfileGameGrid lang={lang} games={games.map((g) => ({ ...g, score: g.myScore }))} />;
      }}
    </ProfileShell>
  );
}
