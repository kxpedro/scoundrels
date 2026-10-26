"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Status = "playing" | "finished" | "wishlist";

/**
 * Status do jogo para o usuário logado.
 * TODO(entrega 5 — social): persistir via Server Action em game_statuses.
 */
export function PlayStatusButtons({ labels }: { labels: Record<Status, string> }) {
  const [selected, setSelected] = useState<Status | null>(null);

  return (
    <>
      {(Object.keys(labels) as Status[]).map((s) => (
        <Button key={s} aria-pressed={selected === s} onClick={() => setSelected(selected === s ? null : s)}>
          {labels[s]}
        </Button>
      ))}
    </>
  );
}
