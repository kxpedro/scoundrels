"use server";

import { and, count, eq, ne } from "drizzle-orm";
import { headers } from "next/headers";
import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { recomputeGameScores } from "@/db/aggregates";
import { account, criticReviews, session, user, userReviews } from "@/db/schema";
import { auth } from "@/lib/auth";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/auth-constants";
import { ensureHandle } from "@/lib/newsroom/handles";
import { tags } from "@/lib/queries/games";
import { getSession } from "@/lib/session";
import { hasRole, roles } from "@/lib/session-roles";
import { HANDLE_PATTERN } from "@/lib/social/constants";

/**
 * Painel de usuários — tudo aqui exige papel admin, revalidado em cada ação.
 * Ninguém altera a própria conta por este painel (evita o admin se trancar para fora).
 */

type Fail = {
  ok: false;
  error: "forbidden" | "invalid" | "email_taken" | "handle_taken" | "self" | "not_found" | "has_critic_reviews" | "wrong_password";
};

async function admin() {
  const s = await getSession();
  if (!s || !hasRole(s.user.role, "admin")) throw new Error("Sem permissão");
  return s.user;
}

async function target(userId: string, adminId: string): Promise<{ id: string } | Fail> {
  if (typeof userId !== "string" || userId.length > 64) return { ok: false, error: "invalid" };
  if (userId === adminId) return { ok: false, error: "self" };
  const [row] = await db.select({ id: user.id }).from(user).where(eq(user.id, userId)).limit(1);
  return row ?? { ok: false, error: "not_found" };
}

const password = z.string().min(PASSWORD_MIN).max(PASSWORD_MAX);
const email = z.email().trim().toLowerCase().max(200);

/** Grava (ou cria) a credencial de senha da conta. */
async function setCredential(userId: string, plain: string) {
  const ctx = await auth.$context;
  const hash = await ctx.password.hash(plain);
  const [existing] = await db
    .select({ id: account.id })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "credential")))
    .limit(1);
  if (existing) await ctx.internalAdapter.updatePassword(userId, hash);
  else await ctx.internalAdapter.linkAccount({ userId, providerId: "credential", accountId: userId, password: hash });
}

export async function createUserWithPassword(input: {
  name: string;
  email: string;
  password: string;
  role: string;
  mustChangePassword: boolean;
}): Promise<{ ok: true; id: string } | Fail> {
  await admin();
  const parsed = z
    .object({ name: z.string().trim().min(1).max(60), email, password, role: z.enum(roles), mustChangePassword: z.boolean() })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const data = parsed.data;

  const [taken] = await db.select({ id: user.id }).from(user).where(eq(user.email, data.email)).limit(1);
  if (taken) return { ok: false, error: "email_taken" };

  const ctx = await auth.$context;
  const created = await ctx.internalAdapter.createUser(
    {
      name: data.name,
      email: data.email,
      emailVerified: true,
      role: data.role,
      mustChangePassword: data.mustChangePassword,
    },
    { method: "admin" },
  );
  await setCredential(created.id, data.password);
  await ensureHandle(created.id);
  if (data.role !== "user") updateTag(tags.games); // lista pública de críticos
  refresh();
  return { ok: true, id: created.id };
}

export async function setUserRole(userId: string, role: string): Promise<{ ok: true } | Fail> {
  const me = await admin();
  const t = await target(userId, me.id);
  if ("ok" in t) return t;
  const parsed = z.enum(roles).safeParse(role);
  if (!parsed.success) return { ok: false, error: "invalid" };
  await db.update(user).set({ role: parsed.data }).where(eq(user.id, userId));
  if (parsed.data !== "user") await ensureHandle(userId);
  updateTag(tags.user(userId));
  updateTag(tags.games);
  refresh();
  return { ok: true };
}

export async function updateUserDetails(
  userId: string,
  input: { name: string; handle: string; email: string; title: string },
): Promise<{ ok: true } | Fail> {
  const me = await admin();
  const t = await target(userId, me.id);
  if ("ok" in t) return t;
  const parsed = z
    .object({
      name: z.string().trim().min(1).max(60),
      handle: z.string().trim().toLowerCase().regex(HANDLE_PATTERN),
      email,
      title: z.string().trim().max(60),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const data = parsed.data;

  const [emailOwner] = await db.select({ id: user.id }).from(user).where(and(eq(user.email, data.email), ne(user.id, userId))).limit(1);
  if (emailOwner) return { ok: false, error: "email_taken" };
  const [handleOwner] = await db.select({ id: user.id }).from(user).where(and(eq(user.handle, data.handle), ne(user.id, userId))).limit(1);
  if (handleOwner) return { ok: false, error: "handle_taken" };

  await db
    .update(user)
    .set({ name: data.name, handle: data.handle, email: data.email, title: data.title || null })
    .where(eq(user.id, userId));
  updateTag(tags.user(userId));
  updateTag(tags.games);
  refresh();
  return { ok: true };
}

/** Define nova senha; derruba as sessões abertas e, se pedido, exige troca no próximo acesso. */
export async function setUserPassword(userId: string, plain: string, mustChange: boolean): Promise<{ ok: true } | Fail> {
  const me = await admin();
  const t = await target(userId, me.id);
  if ("ok" in t) return t;
  if (!password.safeParse(plain).success) return { ok: false, error: "invalid" };
  await setCredential(userId, plain);
  await db.update(user).set({ mustChangePassword: Boolean(mustChange) }).where(eq(user.id, userId));
  await (await auth.$context).internalAdapter.deleteUserSessions(userId);
  refresh();
  return { ok: true };
}

export async function revokeUserSessions(userId: string): Promise<{ ok: true } | Fail> {
  const me = await admin();
  const t = await target(userId, me.id);
  if ("ok" in t) return t;
  await (await auth.$context).internalAdapter.deleteUserSessions(userId);
  refresh();
  return { ok: true };
}

export async function setUserSuspended(userId: string, suspended: boolean, reason = ""): Promise<{ ok: true } | Fail> {
  const me = await admin();
  const t = await target(userId, me.id);
  if ("ok" in t) return t;
  await db
    .update(user)
    .set(suspended ? { bannedAt: new Date(), banReason: reason.trim().slice(0, 200) || null } : { bannedAt: null, banReason: null })
    .where(eq(user.id, userId));
  if (suspended) await (await auth.$context).internalAdapter.deleteUserSessions(userId);
  refresh();
  return { ok: true };
}

/**
 * Exclui a conta e tudo o que ela publicou como público (reviews, listas, comentários, status…).
 * Quem assina críticas da redação não pode ser excluído (o histórico editorial fica): suspenda.
 */
export async function deleteUserAccount(userId: string): Promise<{ ok: true } | Fail> {
  const me = await admin();
  const t = await target(userId, me.id);
  if ("ok" in t) return t;
  const [{ n }] = await db.select({ n: count() }).from(criticReviews).where(eq(criticReviews.authorId, userId));
  if (n > 0) return { ok: false, error: "has_critic_reviews" };

  const affected = await db.selectDistinct({ gameId: userReviews.gameId }).from(userReviews).where(eq(userReviews.userId, userId));
  await db.delete(session).where(eq(session.userId, userId));
  await db.delete(user).where(eq(user.id, userId)); // cascade: reviews, curtidas, comentários, listas, seguidores
  for (const { gameId } of affected) {
    await recomputeGameScores(db, gameId);
    updateTag(tags.gameReviews(gameId));
  }
  updateTag(tags.games);
  updateTag(tags.lists);
  refresh();
  return { ok: true };
}

/* ───────────────────────── Própria conta ───────────────────────── */

/** Troca a própria senha (e libera o aviso de troca obrigatória). Mantém só a sessão atual. */
export async function changeMyPassword(currentPassword: string, newPassword: string): Promise<{ ok: true } | Fail> {
  const s = await getSession();
  if (!s) return { ok: false, error: "forbidden" };
  if (!password.safeParse(newPassword).success || typeof currentPassword !== "string") return { ok: false, error: "invalid" };
  try {
    await auth.api.changePassword({
      body: { currentPassword, newPassword, revokeOtherSessions: true },
      headers: await headers(),
    });
  } catch {
    return { ok: false, error: "wrong_password" };
  }
  await db.update(user).set({ mustChangePassword: false }).where(eq(user.id, s.user.id));
  refresh();
  return { ok: true };
}
