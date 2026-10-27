import "server-only";
import { headers } from "next/headers";
import { forbidden, unauthorized } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { hasRole, type Role } from "@/lib/session-roles";

export { hasRole, roles, type Role } from "@/lib/session-roles";

/**
 * Sessão da requisição atual (lê cookies → precisa estar sob <Suspense>).
 * Deduplicada por requisição com React.cache.
 */
export const getSession = cache(async () => {
  // O Better Auth compara a expiração com new Date(); connection() deixa a leitura só em tempo de requisição.
  await connection();
  const session = await auth.api.getSession({ headers: await headers() });
  // Suspensão vale na hora, mesmo para uma sessão aberta antes dela.
  return session?.user.bannedAt ? null : session;
});

/** Exige login e papel mínimo. 401 sem sessão, 403 sem permissão. */
export async function requireRole(required: Role) {
  const session = await getSession();
  if (!session) unauthorized();
  if (!hasRole(session.user.role, required)) forbidden();
  return session;
}
