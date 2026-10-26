import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CatalogSkeleton } from "@/components/catalog/catalog-skeleton";
import { CatalogView, parseCatalogParams } from "@/components/catalog/catalog-view";
import { path } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { getFilterLabels } from "@/lib/queries/catalog";

export async function generateMetadata({ params }: PageProps<"/[lang]/estudios/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { studio } = await getFilterLabels({ studio: slug });
  return studio ? { title: studio } : {};
}

export default function StudioPage(props: PageProps<"/[lang]/estudios/[slug]">) {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <Studio params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Studio({ params, searchParams }: Pick<PageProps<"/[lang]/estudios/[slug]">, "params" | "searchParams">) {
  const [{ slug }, sp, lang, dict] = await Promise.all([params, searchParams, getLocale(), getDictionary()]);
  const { studio } = await getFilterLabels({ studio: slug });
  if (!studio) notFound();

  return (
    <>
      <p className="label-mono pt-6 text-[11px] text-muted">{dict.catalog.studio}</p>
      <CatalogView
        params={parseCatalogParams(sp)}
        fixed={{ studio: slug }}
        basePath={path(lang, `/estudios/${slug}`)}
        title={studio}
        lang={lang}
        dict={dict}
      />
    </>
  );
}
