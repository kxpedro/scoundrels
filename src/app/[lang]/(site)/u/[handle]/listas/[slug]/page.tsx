import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListItems } from "@/components/lists/list-items";
import { LikeButton } from "@/components/social/like-button";
import { RelativeTime } from "@/components/ui/relative-time";
import { path } from "@/i18n/config";
import { getDictionary, getLocale, t } from "@/i18n/dictionaries";
import { getList } from "@/lib/queries/social";
import { getSession } from "@/lib/session";

export async function generateMetadata({ params }: PageProps<"/[lang]/u/[handle]/listas/[slug]">): Promise<Metadata> {
  const { handle, slug } = await params;
  const list = await getList(handle, slug);
  if (!list || !list.isPublic) return { robots: { index: false } };
  return { title: list.title, description: list.description ?? undefined };
}

export default function ListPage(props: PageProps<"/[lang]/u/[handle]/listas/[slug]">) {
  return (
    <Suspense fallback={<div className="mt-8 h-72 animate-pulse bg-panel" aria-hidden />}>
      <Content params={props.params} />
    </Suspense>
  );
}

async function Content({ params }: Pick<PageProps<"/[lang]/u/[handle]/listas/[slug]">, "params">) {
  const { handle, slug } = await params;
  const [list, lang, dict, session] = await Promise.all([getList(handle, slug), getLocale(), getDictionary(), getSession()]);
  if (!list) notFound();
  const owner = session?.user.id === list.owner.id;
  // Lista privada só existe para o dono.
  if (!list.isPublic && !owner) notFound();
  const l = dict.lists;

  return (
    <article className="max-w-3xl pt-8">
      <p className="label-mono text-[11px] text-magenta">
        {l.title} ·{" "}
        <Link href={path(lang, `/u/${handle}/listas`)} className="hover:underline">
          {t(l.by, { user: handle })}
        </Link>
        {!list.isPublic && <span className="ml-2 text-amber">{l.privateBadge}</span>}
      </p>
      <h1 className="font-display mt-1 text-2xl text-fg sm:text-3xl">{list.title}</h1>
      {list.description && <p className="mt-2 text-muted">{list.description}</p>}
      <div className="mt-3 mb-6 flex flex-wrap items-center gap-4 text-[13px] text-muted">
        {list.isPublic && (
          <LikeButton kind="list" id={list.id} count={list.likeCount} loginHref={path(lang, "/entrar")} labels={dict.social} />
        )}
        <span>{t(list.items.length === 1 ? l.gamesOne : l.games, { n: list.items.length })}</span>
        <span>
          <RelativeTime date={list.updatedAt} labels={dict.time} />
        </span>
      </div>

      <ListItems
        listId={list.id}
        items={list.items}
        meta={{ title: list.title, description: list.description ?? "", isPublic: list.isPublic }}
        owner={owner}
        lang={lang}
        labels={l}
        errors={dict.social.errors}
      />
    </article>
  );
}
