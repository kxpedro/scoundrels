import Link from "next/link";
import { path } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { getSession } from "@/lib/session";

/** Aviso persistente para contas com senha definida pelo admin. Lê a sessão → fica sob <Suspense>. */
export async function MustChangeBanner() {
  const session = await getSession();
  if (!session?.user.mustChangePassword) return null;
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);
  return (
    <div className="bg-amber/15 px-4 py-2 text-center text-[13px] text-amber">
      {dict.passwordChange.banner}{" "}
      <Link href={`${path(lang, "/conta")}#senha`} className="font-medium underline underline-offset-3">
        {dict.passwordChange.bannerCta} →
      </Link>
    </div>
  );
}
