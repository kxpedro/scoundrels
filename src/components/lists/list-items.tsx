"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Cover } from "@/components/game/cover";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import { formatScore } from "@/lib/score";
import { deleteList, moveListItem, removeGameFromList, setListItemNote, updateList } from "@/lib/social/actions";
import { ListMetaForm, type ListMeta } from "./list-meta-form";

export type ListItemData = {
  gameId: string;
  note: string | null;
  game: { slug: string; title: string; coverUrl: string | null; criticScore: number | null };
};

/**
 * Itens da lista (ranking numerado). Para o dono, alterna para modo edição:
 * ↑↓ para reordenar, nota por item, remover, editar título/visibilidade e apagar a lista.
 */
export function ListItems({
  listId,
  items,
  meta,
  owner,
  lang,
  labels,
  errors,
}: {
  listId: string;
  items: ListItemData[];
  meta: ListMeta;
  owner: boolean;
  lang: string;
  labels: Dictionary["lists"];
  errors: Dictionary["social"]["errors"];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [metaOpen, setMetaOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (!res.ok) setError(errors[res.error as keyof typeof errors] ?? null);
      router.refresh();
    });
  }

  return (
    <div>
      {owner && (
        <div className="mb-5 flex flex-wrap gap-2">
          <Button aria-pressed={editing} onClick={() => setEditing(!editing)}>
            {editing ? labels.done : labels.edit}
          </Button>
          {editing && (
            <>
              <Button onClick={() => setMetaOpen(!metaOpen)}>{labels.editDetails}</Button>
              <Button
                className="border-red text-red"
                onClick={() => {
                  if (!window.confirm(labels.deleteConfirm)) return;
                  startTransition(async () => {
                    const res = await deleteList(listId);
                    if (res.ok) router.push(`/${lang}/u/${res.handle}/listas`);
                  });
                }}
              >
                {labels.delete}
              </Button>
            </>
          )}
        </div>
      )}

      {owner && editing && metaOpen && (
        <div className="mb-6 border border-line-strong p-4">
          <ListMetaForm
            initial={meta}
            submitLabel={labels.save}
            labels={labels}
            pending={pending}
            onCancel={() => setMetaOpen(false)}
            onSubmit={(m) => {
              setMetaOpen(false);
              run(() => updateList(listId, m));
            }}
          />
        </div>
      )}

      {error && (
        <p role="alert" className="mb-3 text-[13px] text-red">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <p className="text-muted">{labels.empty}</p>
      ) : (
        <ol className={cn("flex flex-col gap-3", pending && "opacity-70")}>
          {items.map((item, i) => (
            <li key={item.gameId} className="grid grid-cols-[32px_48px_minmax(0,1fr)_auto] items-center gap-3">
              <span className="font-score text-2xl font-bold text-brand">{i + 1}</span>
              <Link href={`/${lang}/jogos/${item.game.slug}`}>
                <Cover title={item.game.title} slug={item.game.slug} url={item.game.coverUrl} sizes="48px" className="h-16 w-12" />
              </Link>
              <div className="min-w-0">
                <Link href={`/${lang}/jogos/${item.game.slug}`} className="link-hot font-medium text-fg">
                  {item.game.title}
                </Link>
                {editing ? (
                  <input
                    defaultValue={item.note ?? ""}
                    maxLength={280}
                    placeholder={labels.notePh}
                    onBlur={(e) => {
                      if (e.target.value !== (item.note ?? "")) run(() => setListItemNote(listId, item.gameId, e.target.value));
                    }}
                    className="mt-1 block w-full border-b border-line-strong bg-transparent py-0.5 text-[13px] text-fg placeholder:text-muted focus:border-cyan focus:outline-none"
                  />
                ) : (
                  item.note && <p className="text-[13px] text-muted">“{item.note}”</p>
                )}
              </div>
              {editing ? (
                <div className="flex gap-1">
                  <Button aria-label={labels.moveUp} disabled={i === 0} className="px-2 py-0.5" onClick={() => run(() => moveListItem(listId, item.gameId, -1))}>
                    ↑
                  </Button>
                  <Button
                    aria-label={labels.moveDown}
                    disabled={i === items.length - 1}
                    className="px-2 py-0.5"
                    onClick={() => run(() => moveListItem(listId, item.gameId, 1))}
                  >
                    ↓
                  </Button>
                  <Button aria-label={labels.remove} className="px-2 py-0.5 hover:text-red" onClick={() => run(() => removeGameFromList(listId, item.gameId))}>
                    ×
                  </Button>
                </div>
              ) : (
                item.game.criticScore !== null && (
                  <span className="chamfer-sm font-score bg-brand px-1.5 font-bold text-on-brand">{formatScore(item.game.criticScore, { average: true })}</span>
                )
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
