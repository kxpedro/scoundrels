/**
 * Define o papel de uma conta no banco de produção (ex.: o primeiro admin, antes de existir a tela Equipe).
 *
 *   npm run prod:promote -- voce@email.com admin
 *
 * A conta precisa ter entrado no site pelo menos uma vez. Lê .env.production.local (npx vercel env pull).
 */
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.production.local" });

const [email, role = "admin"] = process.argv.slice(2);
const roles = ["user", "critic", "editor", "admin"];

async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!url) throw new Error("Sem DATABASE_URL em .env.production.local.");
  if (!email || !roles.includes(role)) throw new Error("Uso: npm run prod:promote -- <email> [user|critic|editor|admin]");

  const sql = postgres(url, { max: 1 });
  try {
    const rows = await sql`update "user" set role = ${role} where lower(email) = lower(${email}) returning email, role`;
    if (!rows.length) throw new Error(`Nenhuma conta com o e-mail ${email}. Entre no site uma vez e tente de novo.`);
    console.log(`OK: ${rows[0].email} agora é ${rows[0].role}.`);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
