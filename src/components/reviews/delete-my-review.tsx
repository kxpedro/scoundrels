"use client";

import { useTransition } from "react";
import { deleteUserReview } from "@/lib/reviews/actions";

export function DeleteMyReview({ gameId, label, confirmText }: { gameId: string; label: string; confirmText: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (window.confirm(confirmText)) startTransition(async () => void (await deleteUserReview(gameId)));
      }}
      className="text-muted hover:text-red disabled:opacity-50"
    >
      {label}
    </button>
  );
}
