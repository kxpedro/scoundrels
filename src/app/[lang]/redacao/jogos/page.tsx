import Image from "next/image";
import Link from "next/link";
import { Guard } from "@/components/newsroom/guard";
import { IgdbSearch } from "@/components/newsroom/igdb-search";
import { NewsroomPageHeader } from "@/components/newsroom/page-header";
import { Button } from "@/components/ui/button";
import { path } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { formatReleaseDate } from "@/lib/format";
import { createGameManually } from "@/lib/newsroom/actions";
import { searchCatalog } from "@/lib/newsroom/queries";

export default function NewsroomGamesPage(props: PageProps<"/[lang]/redacao/jogos">) {
  return (
    <Guard role="editor">
      {async () => {
        const { q } = await props.searchParams;
        const term = typeof q === "string" ? q : "";
        const [lang, dict, catalog] = await Promise.all([getLocale(), getDictionary(), searchCatalog("", 30)]);
        const l = dict.newsroom.games;
        const field =
          "border-[1.5px] border-line-strong bg-panel px-3 py-1.5 text-fg placeholder:text-muted focus:border-cyan focus:outline-none";

        return (
          <>
            <NewsroomPageHeader title={l.title} lead={l.lead} />

            <h2 className="label-mono mb-2 text-[11px] text-cyan">{l.igdbSearch}</h2>
            <IgdbSearch labels={l} initialTerm={term} />

            <details className="mt-8 max-w-lg">
              <summary className="label-mono cursor-pointer text-[11px] text-label hover:text-fg">{l.manual}</summary>
              <form action={createGameManually} className="mt-3 flex flex-wrap items-end gap-2">
                <label className="flex flex-1 flex-col gap-1">
                  <span className="label-mono text-[10px] text-muted">{l.manualTitle}</span>
                  <input name="title" required maxLength={160} className={field} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="label-mono text-[10px] text-muted">{l.manualDate}</span>
                  <input name="releaseDate" type="date" className={field} />
                </label>
                <Button type="submit">{l.create}</Button>
              </form>
            </details>

            <h2 className="label-mono mt-10 mb-3 text-[11px] text-cyan">
              {l.catalog} · {catalog.length}
            </h2>
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5 xl:grid-cols-8">
              {catalog.map((g) => (
                <li key={g.id}>
                  <Link href={path(lang, `/jogos/${g.slug}`)} className="lift-lg block" title={g.title}>
                    <div className="chamfer relative aspect-[3/4] bg-raised">
                      {g.coverUrl ? (
                        <Image src={g.coverUrl} alt={g.title} fill sizes="120px" className="object-cover" />
                      ) : (
                        <span className="font-score absolute inset-x-2 top-2 text-xs font-bold text-cyan uppercase">{g.title}</span>
                      )}
                    </div>
                    <span className="mt-1 block truncate text-xs text-fg">{g.title}</span>
                    <span className="label-mono block text-[10px] text-muted">
                      {g.releaseDate ? formatReleaseDate(g.releaseDate) : "—"} {g.igdbId ? "· IGDB" : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        );
      }}
    </Guard>
  );
}
