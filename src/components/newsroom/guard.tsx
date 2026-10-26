import { Suspense } from "react";
import type { Role } from "@/lib/session-roles";
import { requireRole } from "@/lib/session";

type Session = Awaited<ReturnType<typeof requireRole>>;

/**
 * Exige papel e entrega a sessão para o conteúdo. Fica sob <Suspense> porque lê cookies;
 * 401/403 são lançados aqui e renderizados pelos arquivos unauthorized/forbidden.
 */
export function Guard({ role, children }: { role: Role; children: (session: Session) => Promise<React.ReactNode> }) {
  return (
    <Suspense fallback={<p className="label-mono py-10 text-[13px] text-muted">&gt; autenticando_</p>}>
      <Gate role={role}>{children}</Gate>
    </Suspense>
  );
}

async function Gate({ role, children }: { role: Role; children: (session: Session) => Promise<React.ReactNode> }) {
  const session = await requireRole(role);
  return children(session);
}
