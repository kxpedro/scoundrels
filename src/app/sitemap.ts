import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { getSitemapEntries } from "@/lib/queries/sitemap";
import { siteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const { games, reviews, critics } = await getSitemapEntries();

  // Cada caminho existe em todos os idiomas; o pt é o canônico e o en entra como alternativo.
  const entry = (to: string, lastModified?: Date, priority = 0.6): MetadataRoute.Sitemap[number] => ({
    url: `${base}/pt${to}`,
    lastModified,
    priority,
    alternates: { languages: Object.fromEntries(locales.map((l) => [l === "pt" ? "pt-BR" : l, `${base}/${l}${to}`])) },
  });

  return [
    entry("", undefined, 1),
    entry("/jogos", undefined, 0.8),
    entry("/reviews", undefined, 0.8),
    entry("/criticos", undefined, 0.5),
    ...games.map((g) => entry(`/jogos/${g.slug}`, g.updatedAt, 0.7)),
    ...reviews.map((r) => entry(`/reviews/${r.slug}`, r.updatedAt, 0.8)),
    ...critics.map((h) => entry(`/criticos/${h}`, undefined, 0.4)),
  ];
}
