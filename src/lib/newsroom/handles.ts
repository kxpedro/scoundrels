import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { slugify } from "@/lib/slug";

/**
 * Garante que o usuário tenha um handle público (usado em /criticos/<handle> e /u/<handle>).
 * Base: nome, ou parte local do e-mail; colisões ganham sufixo numérico.
 */
export async function ensureHandle(userId: string): Promise<string> {
  const [u] = await db.select({ handle: user.handle, name: user.name, email: user.email }).from(user).where(eq(user.id, userId)).limit(1);
  if (!u) throw new Error("Usuário não encontrado");
  if (u.handle) return u.handle;

  const base = slugify(u.name || u.email.split("@")[0]) || "membro";
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const [taken] = await db.select({ id: user.id }).from(user).where(eq(user.handle, candidate)).limit(1);
    if (taken) continue;
    await db.update(user).set({ handle: candidate }).where(eq(user.id, userId));
    return candidate;
  }
  throw new Error("Não foi possível gerar um handle");
}
