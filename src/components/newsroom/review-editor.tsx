"use client";

import type { JSONContent } from "@tiptap/core";
import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { CriticReviewStatus } from "@/db/schema";
import type { Dictionary } from "@/i18n/dictionaries";
import { t } from "@/i18n/interpolate";
import { cn } from "@/lib/cn";
import { reviewExtensions } from "@/lib/editor/extensions";
import {
  archiveReview,
  deleteReview,
  publishReview,
  requestChanges,
  saveReview,
  submitReview,
  type ReviewInput,
} from "@/lib/newsroom/actions";
import { StatusTag } from "./status-tag";

type Labels = Dictionary["newsroom"];

export type EditorReview = {
  id: string;
  status: CriticReviewStatus;
  title: string;
  excerpt: string | null;
  score: number | null;
  platformTestedId: number | null;
  pros: string[];
  cons: string[];
  body: JSONContent | null;
  editorNote: string | null;
  editorName: string | null;
  publicUrl: string | null;
};

type Props = {
  review: EditorReview;
  game: { title: string; year: string | null };
  platformOptions: Array<{ id: number; name: string; shortName: string | null }>;
  permissions: { edit: boolean; submit: boolean; decide: boolean; publish: boolean; archive: boolean; delete: boolean };
  labels: Labels;
};

type SaveState = "idle" | "saving" | "saved" | "error";

export function ReviewEditor({ review, game, platformOptions, permissions, labels }: Props) {
  const l = labels.editor;
  const a = labels.reviewAdmin;
  const router = useRouter();
  const pathname = usePathname();
  const [title, setTitle] = useState(review.title);
  const [excerpt, setExcerpt] = useState(review.excerpt ?? "");
  const [score, setScore] = useState<number | null>(review.score);
  const [platformId, setPlatformId] = useState<number | null>(review.platformTestedId);
  const [pros, setPros] = useState(review.pros);
  const [cons, setCons] = useState(review.cons);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [words, setWords] = useState(0);
  const [problem, setProblem] = useState<string | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  /** Última versão gravada (serializada). Autosave só dispara quando o snapshot difere dela. */
  const lastSaved = useRef<string | null>(null);

  const editor = useEditor({
    extensions: [...reviewExtensions, Placeholder.configure({ placeholder: l.bodyPh })],
    content: review.body ?? { type: "doc", content: [] },
    editable: permissions.edit,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editorProps: { attributes: { class: "review-prose min-h-[360px] focus:outline-none" } },
    onCreate: ({ editor }) => setWords(countWords(editor)),
    onUpdate: ({ editor }) => setWords(countWords(editor)),
  });

  const snapshot = useCallback(
    (): ReviewInput => ({
      title,
      excerpt,
      score,
      platformTestedId: platformId,
      pros,
      cons,
      // JSON puro: attrs do ProseMirror não são objetos simples e não serializam em Server Actions.
      body: JSON.parse(JSON.stringify(editor?.getJSON() ?? review.body)),
    }),
    [title, excerpt, score, platformId, pros, cons, editor, review.body],
  );

  // Referência inicial assim que o editor existe: abrir a página não conta como alteração.
  useEffect(() => {
    if (editor && lastSaved.current === null) lastSaved.current = JSON.stringify(snapshot());
  }, [editor, snapshot]);

  const isDirty = useCallback(
    () => lastSaved.current !== null && JSON.stringify(snapshot()) !== lastSaved.current,
    [snapshot],
  );

  const saving = useRef(false);
  const save = useCallback(async () => {
    if (!permissions.edit || !isDirty()) return true;
    if (saving.current) return false;
    saving.current = true;
    setSaveState("saving");
    const data = snapshot();
    let ok = false;
    try {
      const res = await saveReview(review.id, data);
      ok = res.ok;
      if (ok) lastSaved.current = JSON.stringify(data);
    } catch {
      ok = false;
    } finally {
      saving.current = false;
    }
    setSaveState(ok ? "saved" : "error");
    return ok;
  }, [permissions.edit, isDirty, review.id, snapshot]);

  // Autosave: verifica a cada 1,2s e grava só o que mudou.
  useEffect(() => {
    if (!permissions.edit) return;
    const timer = setInterval(() => void save(), 1200);
    return () => clearInterval(timer);
  }, [permissions.edit, save]);

  // Avisa ao sair com alterações não salvas.
  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      if (isDirty()) e.preventDefault();
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [isDirty]);

  const complete = Boolean(title.trim()) && score !== null && words > 0;

  function run(action: () => Promise<unknown>) {
    setProblem(null);
    startTransition(async () => {
      // Espera um autosave em andamento terminar antes de gravar a versão final.
      while (saving.current) await new Promise((r) => setTimeout(r, 100));
      if (!(await save())) {
        setProblem(l.saveError);
        return;
      }
      try {
        await action();
      } catch (err) {
        setProblem(err instanceof Error && err.message === "incomplete" ? l.missing : l.saveError);
      }
    });
  }

  const statusLine =
    saveState === "saving" ? l.saving : saveState === "saved" ? l.saved : saveState === "error" ? l.saveError : null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-fg">{game.title}</span>
          {game.year && <span className="label-mono text-[11px] text-muted">{game.year}</span>}
          <StatusTag status={review.status} label={labels.status[review.status]} />
        </div>
        <div className="flex items-center gap-4">
          {statusLine && (
            <span className={cn("label-mono text-[10px]", saveState === "error" ? "text-red" : "text-cyan")} role="status">
              {statusLine}
            </span>
          )}
          {review.publicUrl && (
            <a href={review.publicUrl} target="_blank" rel="noreferrer" className="link-hot text-xs text-cyan">
              {l.view} ↗
            </a>
          )}
        </div>
      </div>

      {review.status === "changes_requested" && review.editorNote && (
        <div className="mb-4 border-l-3 border-magenta bg-magenta/10 px-3 py-2">
          <div className="label-mono text-[10px] text-magenta">{t(l.changesBy, { name: review.editorName ?? "—" })}</div>
          <p className="text-fg">“{review.editorNote}”</p>
        </div>
      )}
      {review.status === "in_review" && !permissions.edit && (
        <p className="label-mono mb-4 bg-amber/10 px-3 py-2 text-[11px] text-amber">{l.readOnly}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="min-w-0">
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value.replace(/\n/g, ""))}
            readOnly={!permissions.edit}
            placeholder={l.titlePh}
            rows={1}
            maxLength={160}
            className="font-display w-full resize-none bg-transparent text-2xl leading-tight text-fg [field-sizing:content] placeholder:text-line-strong focus:outline-none"
          />
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value.replace(/\n/g, ""))}
            readOnly={!permissions.edit}
            placeholder={l.excerptPh}
            rows={1}
            maxLength={280}
            className="mt-2 w-full resize-none border-b border-dashed border-line-strong bg-transparent pb-2 text-muted [field-sizing:content] placeholder:text-line-strong focus:outline-none"
          />

          {permissions.edit && editor && <Toolbar editor={editor} labels={l.toolbar} />}
          <EditorContent editor={editor} className="mt-3" />
          <p className="label-mono mt-4 text-[10px] text-muted">
            {t(l.words, { n: words, m: Math.max(1, Math.round(words / 220)) })}
          </p>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="chamfer bg-panel p-3">
            <div className="label-mono text-[10px] text-label">{l.score}</div>
            <div className="my-2 flex items-center gap-2.5">
              <span className="chamfer font-score bg-brand px-3 py-0.5 text-[28px] font-bold text-on-brand">
                {score === null ? "—" : score.toFixed(1)}
              </span>
              <span className="text-[11px] text-muted">{l.scoreHint}</span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              step={0.5}
              value={score ?? 5}
              disabled={!permissions.edit}
              onChange={(e) => setScore(Number(e.target.value))}
              aria-label={l.score}
              className="w-full accent-brand"
            />
          </div>

          <label className="block">
            <span className="label-mono text-[10px] text-label">{l.platform}</span>
            <select
              value={platformId ?? ""}
              disabled={!permissions.edit}
              onChange={(e) => setPlatformId(e.target.value ? Number(e.target.value) : null)}
              className="mt-1 block w-full border-[1.5px] border-line-strong bg-panel px-2 py-1.5 text-fg focus:border-cyan focus:outline-none"
            >
              <option value="">{l.noPlatform}</option>
              {platformOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <ListField label={l.pros} tone="text-cyan" sign="+" items={pros} onChange={setPros} editable={permissions.edit} labels={l} />
          <ListField label={l.cons} tone="text-red" sign="-" items={cons} onChange={setCons} editable={permissions.edit} labels={l} />

          <div className="mt-2 flex flex-col gap-2">
            {permissions.submit && (
              <Button variant="primary" disabled={pending} onClick={() => run(() => submitReview(review.id))}>
                {l.submit}
              </Button>
            )}
            {permissions.decide && (
              <>
                <Button variant="primary" disabled={pending} onClick={() => run(() => publishReview(review.id))}>
                  {l.publish}
                </Button>
                {!noteOpen ? (
                  <Button disabled={pending} onClick={() => setNoteOpen(true)}>
                    {l.requestChanges}
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2 border border-magenta/40 p-2">
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={l.notePh}
                      rows={3}
                      autoFocus
                      className="w-full resize-y bg-panel px-2 py-1.5 text-fg placeholder:text-muted focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 border-magenta text-magenta"
                        disabled={pending || !note.trim()}
                        onClick={() => run(() => requestChanges(review.id, note))}
                      >
                        {l.sendNote}
                      </Button>
                      <Button onClick={() => setNoteOpen(false)}>{l.cancel}</Button>
                    </div>
                  </div>
                )}
              </>
            )}
            {permissions.publish && review.status === "archived" && (
              <Button variant="primary" disabled={pending} onClick={() => run(() => publishReview(review.id))}>
                {a.republish}
              </Button>
            )}
            {(permissions.submit || permissions.decide) && !complete && (
              <p className="text-[11px] text-muted">{l.missing}</p>
            )}

            {(permissions.archive || permissions.delete) && (
              <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
                {permissions.archive && (
                  <Button
                    className="border-amber text-amber"
                    disabled={pending}
                    onClick={() => {
                      if (window.confirm(a.archiveConfirm)) run(() => archiveReview(review.id));
                    }}
                  >
                    {a.archive}
                  </Button>
                )}
                {permissions.delete && (
                  <Button
                    className="border-red text-red"
                    disabled={pending}
                    onClick={() => {
                      // Confirmação forte: digitar o título (ou o nome do jogo, se o rascunho não tiver título).
                      const expected = (title.trim() || game.title).toLowerCase();
                      const typed = window.prompt(`${a.deletePrompt}\n\n${title.trim() || game.title}`);
                      if (typed === null) return;
                      if (typed.trim().toLowerCase() !== expected) return setProblem(a.deleteMismatch);
                      startTransition(async () => {
                        const res = await deleteReview(review.id);
                        if (!res.ok) return setProblem(l.saveError);
                        lastSaved.current = null; // nada a salvar: evita o aviso de saída
                        router.push(pathname.replace(/\/redacao\/.*$/, "/redacao"));
                      });
                    }}
                  >
                    {a.delete}
                  </Button>
                )}
                {permissions.archive && <p className="text-[11px] text-muted">{a.archiveHint}</p>}
              </div>
            )}
            {problem && (
              <p role="alert" className="text-[13px] text-red">
                {problem}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function countWords(editor: Editor): number {
  const text = editor.getText().trim();
  return text ? text.split(/\s+/).length : 0;
}

function Toolbar({ editor, labels }: { editor: Editor; labels: Labels["editor"]["toolbar"] }) {
  const chain = () => editor.chain().focus();
  const items: Array<{ label: string; text: string; active: boolean; run: () => void }> = [
    { label: labels.bold, text: "B", active: editor.isActive("bold"), run: () => chain().toggleBold().run() },
    { label: labels.italic, text: "I", active: editor.isActive("italic"), run: () => chain().toggleItalic().run() },
    { label: labels.h2, text: "H2", active: editor.isActive("heading", { level: 2 }), run: () => chain().toggleHeading({ level: 2 }).run() },
    { label: labels.h3, text: "H3", active: editor.isActive("heading", { level: 3 }), run: () => chain().toggleHeading({ level: 3 }).run() },
    { label: labels.quote, text: "“ ”", active: editor.isActive("blockquote"), run: () => chain().toggleBlockquote().run() },
    { label: labels.bullet, text: "•", active: editor.isActive("bulletList"), run: () => chain().toggleBulletList().run() },
    { label: labels.ordered, text: "1.", active: editor.isActive("orderedList"), run: () => chain().toggleOrderedList().run() },
    {
      label: labels.link,
      text: "Link",
      active: editor.isActive("link"),
      run: () => {
        if (editor.isActive("link")) return chain().unsetLink().run();
        const url = window.prompt(labels.linkPrompt);
        if (url && /^(https?:\/\/|mailto:)/i.test(url)) chain().extendMarkRange("link").setLink({ href: url }).run();
      },
    },
  ];

  return (
    <div role="toolbar" className="label-mono mt-4 flex flex-wrap border border-line text-[11px]">
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          title={item.label}
          aria-label={item.label}
          aria-pressed={item.active}
          onClick={item.run}
          className="border-r border-line px-2.5 py-1 last:border-r-0 hover:text-fg aria-pressed:bg-raised aria-pressed:text-brand"
        >
          {item.text}
        </button>
      ))}
    </div>
  );
}

function ListField({
  label,
  tone,
  sign,
  items,
  onChange,
  editable,
  labels,
}: {
  label: string;
  tone: string;
  sign: "+" | "-";
  items: string[];
  onChange: (items: string[]) => void;
  editable: boolean;
  labels: Labels["editor"];
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (v && items.length < 8) onChange([...items, v]);
    setDraft("");
  };

  return (
    <div>
      <div className={cn("label-mono text-[10px]", tone)}>{label}</div>
      <ul className="mt-1 space-y-0.5">
        {items.map((item, i) => (
          <li key={`${item}-${i}`} className="group flex items-start gap-1.5">
            <span className={cn("font-mono", tone)}>[{sign}]</span>
            <span className="flex-1">{item}</span>
            {editable && (
              <button
                type="button"
                aria-label="Remover"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                className="text-muted opacity-0 group-hover:opacity-100 hover:text-red focus:opacity-100"
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ul>
      {editable && items.length < 8 && (
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          onBlur={add}
          maxLength={120}
          placeholder={labels.addItem}
          className="mt-1 w-full bg-transparent text-[13px] text-fg placeholder:text-muted focus:outline-none"
        />
      )}
    </div>
  );
}
