import Link from "next/link";
import { notFound } from "next/navigation";
import { GameEditForm } from "@/components/newsroom/game-edit-form";
import { Guard } from "@/components/newsroom/guard";
import { NewsroomPageHeader } from "@/components/newsroom/page-header";
import { path } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { getGameForEdit } from "@/lib/newsroom/queries";

export default function EditGamePage(props: PageProps<"/[lang]/redacao/jogos/[slug]">) {
  return (
    <Guard role="editor">
      {async () => {
        const { slug } = await props.params;
        const [game, lang, dict] = await Promise.all([getGameForEdit(slug), getLocale(), getDictionary()]);
        if (!game) notFound();
        const l = dict.newsroom.games;

        return (
          <>
            <Link href={path(lang, "/redacao/jogos")} className="link-hot label-mono text-[11px] text-cyan">
              {l.back}
            </Link>
            <NewsroomPageHeader
              title={`${l.editTitle}: ${game.title}`}
              action={
                !game.archivedAt && (
                  <Link href={path(lang, `/jogos/${game.slug}`)} target="_blank" className="link-hot text-[13px] text-cyan">
                    {l.viewOnSite} ↗
                  </Link>
                )
              }
            />
            <GameEditForm
              key={game.updatedAt.toISOString()}
              lang={lang}
              labels={l}
              game={{
                id: game.id,
                title: game.title,
                slug: game.slug,
                releaseDate: game.releaseDate,
                coverUrl: game.coverUrl,
                summary: game.summary,
                igdbId: game.igdbId,
                genres: game.genres,
                platforms: game.platforms,
                studios: game.studios,
              }}
            />
          </>
        );
      }}
    </Guard>
  );
}
