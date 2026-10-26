"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries";
import { authClient } from "@/lib/auth-client";

type Props = {
  providers: { google: boolean; discord: boolean };
  labels: Dictionary["auth"];
};

/** Aceita só caminhos internos em ?next= para evitar open redirect. */
function safeNext(value: string | null, fallback: string) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

export function SignInForm({ providers, labels }: Props) {
  const { lang } = useParams<{ lang: string }>();
  const next = safeNext(useSearchParams().get("next"), `/${lang}`);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const { error } = await authClient.signIn.magicLink({ email, callbackURL: next });
    setState(error ? "error" : "sent");
  }

  const social = (["google", "discord"] as const).filter((p) => providers[p]);

  return (
    <div className="space-y-6">
      {social.length > 0 && (
        <>
          <div className="space-y-2.5">
            {social.map((p) => (
              <Button
                key={p}
                className="w-full py-2.5"
                onClick={() => authClient.signIn.social({ provider: p, callbackURL: next })}
              >
                {labels[p]}
              </Button>
            ))}
          </div>
          <p className="label-mono text-center text-[11px] text-muted">— {labels.or} —</p>
        </>
      )}

      <form onSubmit={sendLink} className="space-y-3">
        <label className="block">
          <span className="label-mono text-xs text-label">{labels.emailLabel}</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={labels.emailPlaceholder}
            className="mt-1.5 block w-full border-[1.5px] border-line-strong bg-panel px-3 py-2 text-fg placeholder:text-muted focus:border-cyan focus:outline-none"
          />
        </label>
        <Button type="submit" variant="primary" className="w-full" disabled={state === "sending"}>
          {labels.sendLink}
        </Button>
        <p role="status" className="min-h-5 text-[13px]">
          {state === "sent" && <span className="text-cyan">{labels.sent}</span>}
          {state === "error" && <span className="text-red">{labels.error}</span>}
        </p>
      </form>
    </div>
  );
}
