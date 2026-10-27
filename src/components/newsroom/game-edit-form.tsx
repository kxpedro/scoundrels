"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Cover } from "@/components/game/cover";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries";
import { t } from "@/i18n/interpolate";
import { resyncGame, setGameArchived, updateGame } from "@/lib/newsroom/actions";

type Labels = Dictionary["newsroom"]["games"];

export type EditableGame = {
  id: string;
  title: string;
  slug: string;
  releaseDate: string | null;
  coverUrl: string | null;
  summary: string | null;
  igdbId: number | null;
  genres: string[];
  platforms: string[];
  studios: Array<{ name: string }>;
};

const field =
  "mt-1 block w-full border-[1.5px] border-line-strong bg-panel px-3 py-1.5 text-fg placeholder:text-muted focus:border-cyan focus:outline-none";

/** Formulário de edição do jogo (mockup 2). Salvar, ressincronizar com o IGDB e arquivar. */
export function GameEditForm({ game, lang, labels: l }: { game: EditableGame; lang: string; labels: Labels }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: game.title,
    slug: game.slug,
    releaseDate: game.releaseDate ?? "",
    coverUrl: game.coverUrl ?? "",
    summary: game.summary ?? "",
  });
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const base = `/${lang}/redacao/jogos`;
  const slugChanged = form.slug !== game.slug;

  function after(res: { ok: boolean; error?: string; slug?: string }, success: string) {
    if (!res.ok) return setMessage({ ok: false, text: l.errors[res.error as keyof Labels["errors"]] ?? "" });
    setMessage({ ok: true, text: success });
    // Endereço mudou: a página de edição também muda de URL.
    if (res.slug && res.slug !== game.slug) router.replace(`${base}/${res.slug}`);
    else router.refresh();
  }

  return (
    <div className="grid gap-6 sm:grid-cols-[140px_minmax(0,1fr)]">
      <div>
        <Cover title={form.title} slug={form.slug} url={form.coverUrl || null} sizes="140px" className="aspect-[3/4] w-[140px]" />
        <p className="mt-1.5 text-[11px] text-muted">{l.coverHint}</p>
      </div>

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          setMessage(null);
          startTransition(async () =>
            after(
              await updateGame(game.id, {
                ...form,
                releaseDate: form.releaseDate || null,
                coverUrl: form.coverUrl.trim() || null,
              }),
              l.saved,
            ),
          );
        }}
      >
        <label className="block">
          <span className="label-mono text-[10px] text-label">{l.title}</span>
          <input required maxLength={160} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={field} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="label-mono text-[10px] text-label">{l.slug}</span>
            <input
              required
              maxLength={80}
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
              className={field}
            />
            {slugChanged && <span className="mt-1 block text-[11px] text-amber">{l.slugWarn}</span>}
          </label>
          <label className="block">
            <span className="label-mono text-[10px] text-label">{l.releaseDate}</span>
            <input type="date" value={form.releaseDate} onChange={(e) => setForm({ ...form, releaseDate: e.target.value })} className={field} />
          </label>
        </div>
        <label className="block">
          <span className="label-mono text-[10px] text-label">{l.coverUrl}</span>
          <input
            type="url"
            value={form.coverUrl}
            onChange={(e) => setForm({ ...form, coverUrl: e.target.value })}
            placeholder="https://"
            className={field}
          />
        </label>
        <label className="block">
          <span className="label-mono text-[10px] text-label">{l.summary}</span>
          <textarea rows={4} maxLength={2000} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className={field} />
        </label>

        <div>
          <span className="label-mono text-[10px] text-label">{l.taxonomy}</span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {game.genres.map((g) => (
              <span key={g} className="label-mono bg-magenta px-1.5 text-[10px] text-on-magenta">
                {g}
              </span>
            ))}
            {game.platforms.map((p) => (
              <span key={p} className="label-mono border border-cyan px-1.5 text-[10px] text-cyan">
                {p}
              </span>
            ))}
            {[...new Set(game.studios.map((s) => s.name))].map((s) => (
              <span key={s} className="label-mono bg-raised px-1.5 text-[10px] text-fg">
                {s}
              </span>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-muted">{l.taxonomyHint}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button type="submit" variant="primary" disabled={pending}>
            {l.save}
          </Button>
          {game.igdbId && (
            <Button type="button" disabled={pending} onClick={() => startTransition(async () => after(await resyncGame(game.id), l.resynced))}>
              {l.resync}
            </Button>
          )}
          <Button
            type="button"
            className="border-amber text-amber"
            disabled={pending}
            onClick={() => {
              if (!window.confirm(t(l.archiveConfirm, { title: game.title }))) return;
              startTransition(async () => {
                const res = await setGameArchived(game.id, true);
                if (res.ok) router.push(`${base}?arquivados=1`);
              });
            }}
          >
            {l.archive}
          </Button>
          {message && (
            <p role="status" className={message.ok ? "text-[13px] text-cyan" : "text-[13px] text-red"}>
              {message.text}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
