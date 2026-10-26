import { ErrorScreen } from "@/components/layout/error-screen";
import { getDictionary } from "@/i18n/dictionaries";

export default async function NotFound() {
  const dict = await getDictionary();
  return <ErrorScreen code="404" title={dict.errors.notFound} lead={dict.errors.notFoundLead} />;
}
