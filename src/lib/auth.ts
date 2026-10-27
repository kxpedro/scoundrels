import "server-only";
import { betterAuth } from "better-auth";
import { eq } from "drizzle-orm";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins/magic-link";
import { db } from "@/db";
import { account, session, user, verification } from "@/db/schema";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/auth-constants";
import { sendEmail } from "@/lib/email";
import { siteUrl } from "@/lib/site-url";

/** Provedor só é ativado quando as duas chaves existem no ambiente. */
function provider(id: string | undefined, secret: string | undefined) {
  return id && secret ? { clientId: id, clientSecret: secret } : undefined;
}

const google = provider(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
const discord = provider(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_CLIENT_SECRET);

export const auth = betterAuth({
  // BETTER_AUTH_URL tem prioridade; na Vercel, sem ela, usa o domínio de produção do projeto.
  baseURL: siteUrl(),
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  user: {
    additionalFields: {
      // input: false → o usuário não consegue definir no cadastro; só admin altera.
      role: { type: "string", required: false, defaultValue: "user", input: false },
      handle: { type: "string", required: false, input: false },
      title: { type: "string", required: false, input: false },
      bio: { type: "string", required: false, input: false },
      bannedAt: { type: "date", required: false, input: false },
      mustChangePassword: { type: "boolean", required: false, defaultValue: false, input: false },
    },
  },
  // Senha só para contas criadas pelo admin (painel de usuários): sem cadastro público por senha.
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: PASSWORD_MIN,
    maxPasswordLength: PASSWORD_MAX,
  },
  databaseHooks: {
    session: {
      create: {
        // Conta suspensa não abre sessão, por nenhum método de login.
        before: async (s) => {
          const [row] = await db.select({ bannedAt: user.bannedAt }).from(user).where(eq(user.id, s.userId)).limit(1);
          if (row?.bannedAt) return false;
        },
      },
    },
  },
  socialProviders: {
    ...(google && { google }),
    ...(discord && { discord }),
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendEmail({
          to: email,
          subject: "Seu link de acesso ao Scoundrels",
          text: `Acesse o Scoundrels: ${url}\n\nO link expira em 5 minutos.`,
          html: `<p>Acesse o Scoundrels:</p><p><a href="${url}">Entrar</a></p><p>O link expira em 5 minutos.</p>`,
        });
      },
    }),
    // Precisa ser o último: grava cookies em Server Actions.
    nextCookies(),
  ],
});

export const enabledProviders = {
  google: Boolean(google),
  discord: Boolean(discord),
};
