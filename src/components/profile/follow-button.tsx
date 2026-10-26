"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { toggleFollow } from "@/lib/social/actions";

export function FollowButton({
  targetId,
  initial,
  signedIn,
  loginHref,
  labels,
}: {
  targetId: string;
  initial: boolean;
  signedIn: boolean;
  loginHref: string;
  labels: { follow: string; following: string };
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initial);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-pressed={following}
      disabled={pending}
      onClick={() => {
        if (!signedIn) return router.push(loginHref);
        const next = !following;
        setFollowing(next);
        startTransition(async () => {
          const res = await toggleFollow(targetId);
          if (res.ok) {
            setFollowing(res.following);
            router.refresh(); // atualiza o contador de seguidores
          } else setFollowing(!next);
        });
      }}
      className={cn(
        "border-[1.5px] border-cyan px-3.5 py-1.5 text-[13px] transition-colors",
        following ? "bg-cyan text-on-cyan" : "text-cyan hover:bg-cyan/10",
      )}
    >
      {following ? labels.following : labels.follow}
    </button>
  );
}
