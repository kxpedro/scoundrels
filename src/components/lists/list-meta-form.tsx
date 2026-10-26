"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries";

export type ListMeta = { title: string; description: string; isPublic: boolean };

const field =
  "mt-1 block w-full border-[1.5px] border-line-strong bg-panel px-3 py-1.5 text-fg placeholder:text-muted focus:border-cyan focus:outline-none";

/** Título, descrição e visibilidade — usado para criar e para editar listas. */
export function ListMetaForm({
  initial,
  submitLabel,
  labels,
  pending,
  error,
  onSubmit,
  onCancel,
}: {
  initial: ListMeta;
  submitLabel: string;
  labels: Dictionary["lists"];
  pending: boolean;
  error?: string | null;
  onSubmit: (meta: ListMeta) => void;
  onCancel?: () => void;
}) {
  const [meta, setMeta] = useState(initial);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(meta);
      }}
      className="max-w-xl space-y-3"
    >
      <label className="block">
        <span className="label-mono text-[10px] text-label">{labels.listTitle}</span>
        <input
          required
          maxLength={100}
          value={meta.title}
          onChange={(e) => setMeta({ ...meta, title: e.target.value })}
          placeholder={labels.titlePh}
          className={field}
        />
      </label>
      <label className="block">
        <span className="label-mono text-[10px] text-label">{labels.description}</span>
        <textarea
          rows={2}
          maxLength={500}
          value={meta.description}
          onChange={(e) => setMeta({ ...meta, description: e.target.value })}
          placeholder={labels.descriptionPh}
          className={field}
        />
      </label>
      <fieldset className="flex gap-4 text-[13px]">
        {[true, false].map((pub) => (
          <label key={String(pub)} className="flex items-center gap-1.5">
            <input type="radio" checked={meta.isPublic === pub} onChange={() => setMeta({ ...meta, isPublic: pub })} className="accent-cyan" />
            {pub ? labels.public : labels.private}
          </label>
        ))}
      </fieldset>
      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" disabled={pending || !meta.title.trim()}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" onClick={onCancel}>
            {labels.cancel}
          </Button>
        )}
        {error && (
          <p role="alert" className="text-[13px] text-red">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
