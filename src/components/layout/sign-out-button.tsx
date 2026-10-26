"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SignOutButton({ label }: { label: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="label-mono text-[11px] text-muted hover:text-red"
      onClick={async () => {
        await authClient.signOut();
        router.refresh();
      }}
    >
      {label}
    </button>
  );
}
