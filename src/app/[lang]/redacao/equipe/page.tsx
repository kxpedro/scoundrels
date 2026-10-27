import { redirect } from "next/navigation";
import { path } from "@/i18n/config";
import { getLocale } from "@/i18n/dictionaries";

/** A antiga página Equipe virou o painel de usuários. */
export default async function TeamRedirect() {
  redirect(path(await getLocale(), "/redacao/usuarios"));
}
