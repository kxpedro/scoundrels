"use client";

import { useState } from "react";

/** Texto com spoiler: escondido até o leitor pedir. */
export function SpoilerText({ text, label }: { text: string; label: string }) {
  const [shown, setShown] = useState(false);
  if (shown) return <p className="mt-1">{text}</p>;
  return (
    <button type="button" onClick={() => setShown(true)} className="mt-1 bg-raised px-2 py-1 text-[13px] text-muted hover:text-fg">
      {label}
    </button>
  );
}
