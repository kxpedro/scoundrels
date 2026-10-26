import "server-only";
import { headers } from "next/headers";
import { forbidden, unauthorized } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";

export const roles = ["user", "critic", "editor", "admin"] as const;
export type Role = (typeof roles)[number];

/** Hierarquia: cada papel herda as permissões dos anteriores. */
export function hasRole(actual: string | null | undefined, required: Role): boolean {
  const a = roles.indexOf((actual ?? "user") as Role);
  return a >= roles.indexOf(required);
}

/**
 * Sessão da requisição atual (lê cookies → precisa estar sob <Suspense>).
 * Deduplicada por requisição com React.cache.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/** Exige login e papel mínimo. 401 sem sessão, 403 sem permissão. */
export async function requireRole(required: Role) {
  const session = await getSession();
  if (!session) unauthorized();
  if (!hasRole(session.user.role, required)) forbidden();
  return session;
}
