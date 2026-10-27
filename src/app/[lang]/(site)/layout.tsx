import { Suspense } from "react";
import { MustChangeBanner } from "@/components/account/must-change-banner";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function SiteLayout({ children }: LayoutProps<"/[lang]">) {
  return (
    <>
      <Suspense fallback={null}>
        <MustChangeBanner />
      </Suspense>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6">{children}</main>
      <SiteFooter />
    </>
  );
}
