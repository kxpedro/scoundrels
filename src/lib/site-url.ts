/** URL pública do site (sem barra final). Na Vercel, cai para o domínio de produção automático. */
export function siteUrl(): string {
  const explicit = process.env.SITE_URL ?? process.env.BETTER_AUTH_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}
