import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

/**
 * Migrations em produção (Neon). Lê .env.production.local, gerado por `npx vercel env pull`.
 * Usa a conexão direta (sem pooler) quando existir — o pgbouncer não combina com DDL em transação.
 */
config({ path: ".env.production.local" });

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) throw new Error("Sem DATABASE_URL em .env.production.local. Rode: npx vercel env pull .env.production.local --environment=production");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
  strict: true,
});
