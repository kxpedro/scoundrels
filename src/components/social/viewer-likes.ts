"use client";

import { getMyLikes } from "@/lib/social/actions";
import type { LikeKind } from "@/lib/social/constants";

/**
 * As páginas públicas são cacheadas para todos, então "eu curti?" é buscado no cliente.
 * Os botões de uma página pedem juntos: os ids acumulam por um tick e viram uma única chamada por tipo.
 */
const pending = new Map<LikeKind, Map<string, Array<(liked: boolean) => void>>>();
let scheduled = false;

function flush() {
  scheduled = false;
  for (const [kind, waiting] of pending) {
    pending.delete(kind);
    const ids = [...waiting.keys()];
    getMyLikes(kind, ids)
      .then((liked) => {
        const set = new Set(liked);
        for (const [id, cbs] of waiting) cbs.forEach((cb) => cb(set.has(id)));
      })
      .catch(() => {
        for (const cbs of waiting.values()) cbs.forEach((cb) => cb(false));
      });
  }
}

export function requestLiked(kind: LikeKind, id: string, cb: (liked: boolean) => void) {
  const byKind = pending.get(kind) ?? new Map<string, Array<(liked: boolean) => void>>();
  byKind.set(id, [...(byKind.get(id) ?? []), cb]);
  pending.set(kind, byKind);
  if (!scheduled) {
    scheduled = true;
    setTimeout(flush, 0);
  }
}
