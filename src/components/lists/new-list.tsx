"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries";
import { createList } from "@/lib/social/actions";
import { ListMetaForm } from "./list-meta-form";

export function NewList({ lang, labels, errors }: { lang: string; labels: Dictionary["lists"]; errors: Dictionary["social"]["errors"] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button variant="primary" onClick={() => setOpen(true)}>
        {labels.newList}
      </Button>
    );
  }

  return (
    <div className="mb-6 w-full border border-line-strong bg-panel/50 p-4">
      <ListMetaForm
        initial={{ title: "", description: "", isPublic: true }}
        submitLabel={labels.create}
        labels={labels}
        pending={pending}
        error={error}
        onCancel={() => setOpen(false)}
        onSubmit={(meta) =>
          startTransition(async () => {
            const res = await createList(meta);
            if (!res.ok) return setError(errors[res.error]);
            router.push(`/${lang}/u/${res.handle}/listas/${res.slug}`);
          })
        }
      />
    </div>
  );
}
