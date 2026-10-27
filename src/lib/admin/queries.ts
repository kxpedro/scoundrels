import "server-only";
import { and, desc, eq, ilike, isNotNull, isNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";

export const userFilters = ["todos", "leitores", "criticos", "editores", "admins", "suspensos"] as const;
export type UserFilter = (typeof userFilters)[number];

const USER_ID = sql.raw(`"user"."id"`);

export async function getUserStats() {
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      staff: sql<number>`count(*) filter (where ${user.role} <> 'user')::int`,
      // Dentro de sql`` o driver não converte Date sozinho: vai como texto ISO.
      recent: sql<number>`count(*) filter (where ${user.createdAt} >= ${weekAgo.toISOString()}::timestamptz)::int`,
      suspended: sql<number>`count(*) filter (where ${user.bannedAt} is not null)::int`,
    })
    .from(user);
  return row;
}

export type AdminUserRow = Awaited<ReturnType<typeof listUsersForAdmin>>[number];

/** Lista do painel: busca por nome, @ ou e-mail; filtro por papel ou suspensão; métodos de login de cada conta. */
export async function listUsersForAdmin({ term = "", filter = "todos" }: { term?: string; filter?: UserFilter }) {
  const q = term.trim();
  const like = `%${q.replace(/[%_\\]/g, "\\$&")}%`;
  const byFilter: Record<UserFilter, SQL | undefined> = {
    todos: undefined,
    leitores: and(eq(user.role, "user"), isNull(user.bannedAt)),
    criticos: eq(user.role, "critic"),
    editores: eq(user.role, "editor"),
    admins: eq(user.role, "admin"),
    suspensos: isNotNull(user.bannedAt),
  };

  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      handle: user.handle,
      role: user.role,
      title: user.title,
      createdAt: user.createdAt,
      bannedAt: user.bannedAt,
      banReason: user.banReason,
      mustChangePassword: user.mustChangePassword,
      // "credential" = e-mail e senha; sem nenhuma conta vinculada = só link por e-mail
      providers: sql<string[]>`coalesce((select array_agg(distinct a.provider_id) from account a where a.user_id = ${USER_ID}), '{}')`,
    })
    .from(user)
    .where(and(byFilter[filter], q ? or(ilike(user.name, like), ilike(user.email, like), ilike(user.handle, like)) : undefined))
    .orderBy(sql`case when ${user.role} = 'admin' then 0 when ${user.role} = 'editor' then 1 when ${user.role} = 'critic' then 2 else 3 end`, desc(user.createdAt))
    .limit(300);
}

