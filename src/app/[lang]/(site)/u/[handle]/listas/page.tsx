import type { Metadata } from "next";
import { Suspense } from "react";
import { ListCard } from "@/components/lists/list-card";
import { NewList } from "@/components/lists/new-list";
import { ProfileShell } from "@/components/profile/profile-shell";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { listUserLists } from "@/lib/queries/social";
import { getSession } from "@/lib/session";

export async function generateMetadata({ params }: PageProps<"/[lang]/u/[handle]/listas">): Promise<Metadata> {
  const [{ handle }, dict] = await Promise.all([params, getDictionary()]);
  return { title: `${dict.lists.title} · @${handle}` };
}

export default function ProfileListsPage(props: PageProps<"/[lang]/u/[handle]/listas">) {
  return (
    <Suspense fallback={<div className="mt-8 h-72 animate-pulse bg-panel" aria-hidden />}>
      <Content params={props.params} />
    </Suspense>
  );
}

async function Content({ params }: Pick<PageProps<"/[lang]/u/[handle]/listas">, "params">) {
  const [{ handle }, lang, dict, session] = await Promise.all([params, getLocale(), getDictionary(), getSession()]);

  return (
    <ProfileShell handle={handle} active="listas" lang={lang} dict={dict}>
      {async ({ user }) => {
        const owner = session?.user.id === user.id;
        const rows = await listUserLists(user.id, owner);
        return (
          <>
            {owner && <NewList lang={lang} labels={dict.lists} errors={dict.social.errors} />}
            {rows.length === 0 ? (
              <p className="mt-4 text-muted">{dict.profile.emptyLists}</p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {rows.map((list) => (
                  <ListCard key={list.id} list={list} lang={lang} dict={dict} />
                ))}
              </div>
            )}
          </>
        );
      }}
    </ProfileShell>
  );
}
