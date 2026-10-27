import { GamesManager } from "@/components/newsroom/games-manager";
import { Guard } from "@/components/newsroom/guard";
import { IgdbSearch } from "@/components/newsroom/igdb-search";
import { NewsroomPageHeader } from "@/components/newsroom/page-header";
import { Button } from "@/components/ui/button";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { createGameManually } from "@/lib/newsroom/actions";
import { hasRole } from "@/lib/session-roles";

export default function NewsroomGamesPage(props: PageProps<"/[lang]/redacao/jogos">) {
  return (
    <Guard role="editor">
      {async (session) => {
        const sp = await props.searchParams;
        const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
        const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);
        const l = dict.newsroom.games;
        const field =
          "border-[1.5px] border-line-strong bg-panel px-3 py-1.5 text-fg placeholder:text-muted focus:border-cyan focus:outline-none";

        return (
          <>
            <NewsroomPageHeader title={l.title} lead={l.lead} />

            <h2 className="label-mono mb-2 text-[11px] text-cyan">{l.igdbSearch}</h2>
            <IgdbSearch labels={l} initialTerm={one("q")} />

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

            <GamesManager
              archived={one("arquivados") === "1"}
              term={one("filtro")}
              isAdmin={hasRole(session.user.role, "admin")}
              lang={lang}
              dict={dict}
            />
          </>
        );
      }}
    </Guard>
  );
}
