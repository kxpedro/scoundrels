"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import { toggleLike } from "@/lib/social/actions";
import type { LikeKind } from "@/lib/social/constants";
import { requestLiked } from "./viewer-likes";

/** Coração com contador. Otimista: muda na hora e corrige com a resposta do servidor. */
export function LikeButton({
  kind,
  id,
  count,
  loginHref,
  labels,
}: {
  kind: LikeKind;
  id: string;
  count: number;
  loginHref: string;
  labels: Dictionary["social"];
}) {
  const [liked, setLiked] = useState(false);
  const [total, setTotal] = useState(count);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let alive = true;
    requestLiked(kind, id, (v) => alive && setLiked(v));
    return () => {
      alive = false;
    };
  }, [kind, id]);

  if (needsLogin) {
    return (
      <Link href={loginHref} className="link-hot text-cyan">
        {labels.loginToLike} →
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={liked}
      aria-label={`${labels.like} (${total})`}
      onClick={() => {
        const next = !liked;
        setLiked(next);
        setTotal((n) => n + (next ? 1 : -1));
        startTransition(async () => {
          const res = await toggleLike(kind, id);
          if (res.ok) {
            setLiked(res.liked);
            setTotal(res.count);
          } else {
            setLiked(!next);
            setTotal((n) => n + (next ? -1 : 1));
            if (res.error === "auth") setNeedsLogin(true);
          }
        });
      }}
      className={cn("inline-flex items-center gap-1 transition-colors", liked ? "text-magenta" : "hover:text-magenta")}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
      </svg>
      {total}
    </button>
  );
}
