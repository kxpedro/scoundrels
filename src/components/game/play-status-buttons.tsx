"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setPlayStatus } from "@/lib/social/actions";
import { playStatuses, type PlayStatus } from "@/lib/social/constants";

/**
 * Status do jogo para o visitante (Jogando / Zerei / Quero jogar / Abandonei).
 * Sem login, qualquer clique leva para a entrada. Otimista: reverte se o servidor recusar.
 */
export function PlayStatusButtons({
  gameId,
  initial,
  signedIn,
  loginHref,
  labels,
}: {
  gameId: string;
  initial: PlayStatus | null;
  signedIn: boolean;
  loginHref: string;
  labels: Record<PlayStatus, string>;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<PlayStatus | null>(initial);
  const [, startTransition] = useTransition();

  function choose(s: PlayStatus) {
    if (!signedIn) {
      router.push(loginHref);
      return;
    }
    const previous = selected;
    const next = selected === s ? null : s;
    setSelected(next);
    startTransition(async () => {
      const res = await setPlayStatus(gameId, next);
      if (!res.ok) setSelected(previous);
    });
  }

  return (
    <>
      {playStatuses.map((s) => (
        <Button key={s} aria-pressed={selected === s} onClick={() => choose(s)}>
          {labels[s]}
        </Button>
      ))}
    </>
  );
}
