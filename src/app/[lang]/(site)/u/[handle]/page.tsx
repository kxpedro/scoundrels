import type { Metadata } from "next";
import { Suspense } from "react";
import { ProfileGameGrid } from "@/components/profile/game-grid";
import { ProfileShell } from "@/components/profile/profile-shell";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { getUserProfile, listUserReviews } from "@/lib/queries/social";

export async function generateMetadata({ params }: PageProps<"/[lang]/u/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getUserProfile(handle);
  return profile ? { title: `${profile.user.name || handle} (@${handle})`, description: profile.user.bio ?? undefined } : {};
}

export default function ProfilePage(props: PageProps<"/[lang]/u/[handle]">) {
  return (
    <Suspense fallback={<div className="mt-8 h-72 animate-pulse bg-panel" aria-hidden />}>
      <Content params={props.params} />
    </Suspense>
  );
}

async function Content({ params }: Pick<PageProps<"/[lang]/u/[handle]">, "params">) {
  const [{ handle }, lang, dict] = await Promise.all([params, getLocale(), getDictionary()]);
  return (
    <ProfileShell handle={handle} active="reviews" lang={lang} dict={dict}>
      {async ({ user }) => {
        const reviews = await listUserReviews(user.id);
        if (!reviews.length) return <p className="text-muted">{dict.profile.emptyReviews}</p>;
        return <ProfileGameGrid lang={lang} games={reviews.map((r) => ({ ...r.game, score: r.score }))} />;
      }}
    </ProfileShell>
  );
}
