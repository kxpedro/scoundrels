import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogSkeleton } from "@/components/catalog/catalog-skeleton";
import { CatalogView, parseCatalogParams } from "@/components/catalog/catalog-view";
import { path } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.catalog.title };
}

export default function CatalogPage(props: PageProps<"/[lang]/jogos">) {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <Catalog searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Catalog({ searchParams }: Pick<PageProps<"/[lang]/jogos">, "searchParams">) {
  const [sp, lang, dict] = await Promise.all([searchParams, getLocale(), getDictionary()]);
  return <CatalogView params={parseCatalogParams(sp)} basePath={path(lang, "/jogos")} lang={lang} dict={dict} />;
}
