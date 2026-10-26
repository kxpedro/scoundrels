"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries";
import { addGameToList, createList, getMyLists, removeGameFromList, type MyListOption } from "@/lib/social/actions";

/** "+ Adicionar à lista ▾": marca/desmarca o jogo nas listas do visitante ou cria uma nova já com ele. */
export function AddToList({
  gameId,
  signedIn,
  loginHref,
  labels,
}: {
  gameId: string;
  signedIn: boolean;
  loginHref: string;
  labels: Dictionary["lists"];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<MyListOption[] | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [pending, startTransition] = useTransition();
  const box = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function toggleOpen() {
    if (!signedIn) {
      router.push(loginHref);
      return;
    }
    setOpen((o) => !o);
    if (options === null) {
      startTransition(async () => {
        const res = await getMyLists(gameId);
        setOptions(res.ok ? res.lists : []);
      });
    }
  }

  function toggleItem(option: MyListOption) {
    setOptions((opts) => opts?.map((o) => (o.id === option.id ? { ...o, contains: !o.contains } : o)) ?? null);
    startTransition(async () => {
      const res = option.contains ? await removeGameFromList(option.id, gameId) : await addGameToList(option.id, gameId);
      if (!res.ok) setOptions((opts) => opts?.map((o) => (o.id === option.id ? option : o)) ?? null);
    });
  }

  function create(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    startTransition(async () => {
      const res = await createList({ title: newTitle, description: "", isPublic: true, gameId });
      if (res.ok) {
        setOptions((opts) => [{ id: res.id, title: newTitle.trim(), contains: true, full: false }, ...(opts ?? [])]);
        setNewTitle("");
      }
    });
  }

  return (
    <div ref={box} className="relative">
      <Button aria-expanded={open} aria-haspopup="true" onClick={toggleOpen}>
        {labels.addToList} ▾
      </Button>
      {open && (
        <div className="absolute top-full left-0 z-20 mt-1 w-72 border border-line-strong bg-panel p-2 text-[13px] shadow-hard">
          {options === null ? (
            <p className="label-mono p-2 text-[11px] text-muted">…</p>
          ) : (
            <ul className="max-h-60 overflow-y-auto">
              {options.map((o) => (
                <li key={o.id}>
                  <label className="flex cursor-pointer items-center gap-2 px-2 py-1.5 hover:bg-raised">
                    <input
                      type="checkbox"
                      checked={o.contains}
                      disabled={pending || (o.full && !o.contains)}
                      onChange={() => toggleItem(o)}
                      className="accent-cyan"
                    />
                    <span className="flex-1 truncate text-fg">{o.title}</span>
                    {o.full && !o.contains && <span className="label-mono text-[10px] text-muted">{labels.full}</span>}
                  </label>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={create} className="mt-2 flex gap-1.5 border-t border-line pt-2">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value.slice(0, 100))}
              placeholder={labels.newWithGame}
              aria-label={labels.newWithGame}
              className="min-w-0 flex-1 border border-line-strong bg-ink px-2 py-1 text-fg placeholder:text-muted focus:border-cyan focus:outline-none"
            />
            <Button type="submit" disabled={pending || !newTitle.trim()} className="px-2 py-1 text-xs">
              +
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
