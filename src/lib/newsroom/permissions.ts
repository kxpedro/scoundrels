import type { CriticReviewStatus } from "@/db/schema";
import { hasRole } from "@/lib/session-roles";

type Actor = { id: string; role: string | null | undefined };
type Review = { authorId: string; status: CriticReviewStatus };

const isEditor = (actor: Actor) => hasRole(actor.role, "editor");

/**
 * Regras do fluxo editorial:
 * - autor edita enquanto está com ele (rascunho ou ajustes);
 * - editor/admin editam em qualquer status (inclusive publicada → atualiza no site);
 * - só editor/admin aprovam ou devolvem.
 */
export function canEdit(actor: Actor, review: Review): boolean {
  if (isEditor(actor)) return true;
  return review.authorId === actor.id && (review.status === "draft" || review.status === "changes_requested");
}

export function canSubmit(actor: Actor, review: Review): boolean {
  return review.authorId === actor.id && (review.status === "draft" || review.status === "changes_requested");
}

export function canDecide(actor: Actor, review: Review): boolean {
  return isEditor(actor) && review.status === "in_review";
}

export function canView(actor: Actor, review: Review): boolean {
  return isEditor(actor) || review.authorId === actor.id;
}
