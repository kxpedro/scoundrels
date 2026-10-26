import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL não definida. Copie .env.example para .env.local.");

// Reaproveita a conexão entre hot reloads em dev.
const globalForDb = globalThis as unknown as { pg?: postgres.Sql };

const client =
  globalForDb.pg ??
  postgres(url, {
    // Pooler do Neon (pgbouncer) não suporta prepared statements.
    prepare: false,
    max: process.env.NODE_ENV === "production" ? 5 : 10,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pg = client;

export const db = drizzle(client, { schema });
export { schema };
