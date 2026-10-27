"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries";
import { t } from "@/i18n/interpolate";
import { deleteGame, setGameArchived } from "@/lib/newsroom/actions";

type Labels = Dictionary["newsroom"]["games"];

/** Editar · Arquivar/Restaurar · Excluir (só admin e só sem reviews). Confirma antes de agir. */
export function GameRowActions({
  game,
  editHref,
  canDelete,
  labels,
}: {
  game: { id: string; title: string; archived: boolean };
  editHref: string;
  canDelete: boolean;
  labels: Labels;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(confirmText: string | null, action: () => Promise<{ ok: boolean; error?: string }>) {
    if (confirmText && !window.confirm(confirmText)) return;
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (!res.ok) setError(labels.errors[res.error as keyof Labels["errors"]] ?? null);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-1.5">
        {!game.archived && (
          <Link href={editHref} className="border-[1.5px] border-line-strong px-2.5 py-0.5 text-xs text-body hover:border-label">
            {labels.edit}
          </Link>
        )}
        {game.archived ? (
          <Button className="px-2.5 py-0.5 text-xs" disabled={pending} onClick={() => run(null, () => setGameArchived(game.id, false))}>
            {labels.restore}
          </Button>
        ) : (
          <Button
            className="border-amber px-2.5 py-0.5 text-xs text-amber"
            disabled={pending}
            onClick={() => run(t(labels.archiveConfirm, { title: game.title }), () => setGameArchived(game.id, true))}
          >
            {labels.archive}
          </Button>
        )}
        {canDelete && (
          <Button
            className="border-red px-2.5 py-0.5 text-xs text-red"
            disabled={pending}
            onClick={() => run(t(labels.deleteConfirm, { title: game.title }), () => deleteGame(game.id))}
          >
            {labels.delete}
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-xs text-red">
          {error}
        </p>
      )}
    </div>
  );
}
