import { ErrorScreen } from "@/components/layout/error-screen";
import { getDictionary } from "@/i18n/dictionaries";

export default async function Forbidden() {
  const dict = await getDictionary();
  return <ErrorScreen code="403" title={dict.errors.forbidden} lead={dict.errors.forbiddenLead} />;
}
