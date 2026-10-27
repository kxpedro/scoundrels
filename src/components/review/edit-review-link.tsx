import Link from "next/link";
import { path, type Locale } from "@/i18n/config";
import { getSession } from "@/lib/session";
import { hasRole } from "@/lib/session-roles";

/** "✎ Editar na redação" — só para o autor e editores. Lê a sessão → fica sob <Suspense>. */
export async function EditReviewLink({ reviewId, authorId, lang, label }: { reviewId: string; authorId: string; lang: Locale; label: string }) {
  const session = await getSession();
  if (!session) return null;
  const allowed = hasRole(session.user.role, "editor") || session.user.id === authorId;
  if (!allowed) return null;
  return (
    <Link
      href={path(lang, `/redacao/reviews/${reviewId}`)}
      className="border-[1.5px] border-cyan px-2.5 py-1 text-[13px] text-cyan transition-colors hover:bg-cyan hover:text-on-cyan"
    >
      {label}
    </Link>
  );
}
