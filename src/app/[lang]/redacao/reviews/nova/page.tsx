import Image from "next/image";
import { isOptimizableCover } from "@/lib/igdb-images";
import Link from "next/link";
import { Guard } from "@/components/newsroom/guard";
import { NewsroomPageHeader } from "@/components/newsroom/page-header";
import { Button } from "@/components/ui/button";
import { path } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { formatReleaseDate } from "@/lib/format";
import { createReviewDraft } from "@/lib/newsroom/actions";
import { searchCatalog } from "@/lib/newsroom/queries";
import { hasRole } from "@/lib/session-roles";

export default function NewReviewPage(props: PageProps<"/[lang]/redacao/reviews/nova">) {
  return (
    <Guard role="critic">
      {async (session) => {
        const { q } = await props.searchParams;
        const term = typeof q === "string" ? q : "";
        const [lang, dict, results] = await Promise.all([getLocale(), getDictionary(), searchCatalog(term)]);
        const nr = dict.newsroom;

        return (
          <>
            <NewsroomPageHeader title={nr.pick.title} lead={nr.pick.lead} />

            <form className="mb-5 flex max-w-lg gap-2" role="search">
              <input
                name="q"
                defaultValue={term}
                placeholder={nr.pick.placeholder}
                aria-label={nr.pick.search}
                className="flex-1 border-[1.5px] border-line-strong bg-panel px-3 py-1.5 text-fg placeholder:text-muted focus:border-cyan focus:outline-none"
              />
              <Button type="submit">{nr.pick.search}</Button>
            </form>

            {results.length === 0 ? (
              <p className="text-muted">
                {nr.pick.none}{" "}
                {hasRole(session.user.role, "editor") && (
                  <Link href={path(lang, `/redacao/jogos?q=${encodeURIComponent(term)}`)} className="link-hot text-cyan">
                    {nr.games.igdbSearch} →
                  </Link>
                )}
              </p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((g) => (
                  <li key={g.id} className="chamfer flex items-center gap-3 bg-panel p-2.5">
                    <div className="relative h-16 w-12 shrink-0 bg-raised">
                      {g.coverUrl && <Image src={g.coverUrl} unoptimized={!isOptimizableCover(g.coverUrl)} alt="" fill sizes="48px" className="object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-fg">{g.title}</div>
                      <div className="label-mono text-[10px] text-muted">
                        {g.releaseDate ? formatReleaseDate(g.releaseDate) : "—"}
                      </div>
                    </div>
                    <form action={createReviewDraft}>
                      <input type="hidden" name="gameId" value={g.id} />
                      <input type="hidden" name="lang" value={lang} />
                      <Button type="submit" className="px-2.5 py-1 text-xs">
                        {nr.pick.start}
                      </Button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </>
        );
      }}
    </Guard>
  );
}
