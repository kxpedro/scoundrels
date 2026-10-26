import { ErrorScreen } from "@/components/layout/error-screen";
import { path } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";

export default async function Unauthorized() {
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);
  return (
    <ErrorScreen
      code="401"
      title={dict.errors.unauthorized}
      action={{ href: path(lang, "/entrar"), label: dict.nav.signIn }}
    />
  );
}
