import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins/magic-link";
import { db } from "@/db";
import { account, session, user, verification } from "@/db/schema";
import { sendEmail } from "@/lib/email";

/** Provedor só é ativado quando as duas chaves existem no ambiente. */
function provider(id: string | undefined, secret: string | undefined) {
  return id && secret ? { clientId: id, clientSecret: secret } : undefined;
}

const google = provider(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
const discord = provider(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_CLIENT_SECRET);

export const auth = betterAuth({
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
