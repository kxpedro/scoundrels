import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { ScoreBadge } from "@/components/ui/score-badge";
import { Tag } from "@/components/ui/tag";
import { path, type Locale } from "@/i18n/config";
import { t, type Dictionary } from "@/i18n/dictionaries";
import type { GameDetail } from "@/lib/queries/games";
import { formatCount, formatReleaseDate } from "@/lib/format";
import { Cover } from "./cover";
import { PlayStatusButtons } from "./play-status-buttons";

export function GameHero({ game, lang, dict }: { game: GameDetail; lang: Locale; dict: Dictionary }) {
  const base = path(lang, `/jogos/${game.slug}`);
  const developer = game.studios.find((s) => s.role === "developer") ?? game.studios[0];

  return (
    <section className="flex flex-wrap gap-6 pt-5">
      <Cover
        title={game.title}
        slug={game.slug}
        url={game.coverUrl}
        priority
        sizes="160px"
        className="shadow-hard-lg h-[214px] w-40 shrink-0"
      />

      <div className="min-w-[260px] flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {game.genres.map((g) => (
            <Tag key={g.slug} variant="genre" href={path(lang, `/jogos?genero=${g.slug}`)}>
              {lang === "pt" ? g.namePt : g.nameEn}
            </Tag>
          ))}
          {game.releaseDate && (
            <Tag variant="neutral" href={path(lang, `/jogos?lancamento=${game.releaseDate.slice(0, 7)}`)}>
              <CalendarIcon />
              {formatReleaseDate(game.releaseDate)}
            </Tag>
          )}
        </div>

        <h1 className="font-display my-2.5 text-3xl leading-none text-fg uppercase sm:text-[34px]">{game.title}</h1>

        <div className="flex flex-wrap items-center gap-2">
          {developer && (
            <span className="mr-1.5 text-[15px] font-medium text-fg">
              <span className="label-mono mr-1.5 text-[11px] text-muted">{dict.game.studio}</span>
              <Link href={path(lang, `/estudios/${developer.slug}`)} className="link-hot">
                {developer.name}
              </Link>
            </span>
          )}
          {game.platforms.map((p) => (
            <Tag key={p.slug} variant="platform" href={path(lang, `/jogos?plataforma=${p.slug}`)}>
              {p.shortName ?? p.name}
            </Tag>
          ))}
        </div>

        <div className="my-5 flex gap-3">
          <ScoreBadge
            variant="hero"
            kind="critic"
            value={game.criticScore}
            label={dict.game.scoundrel}
            caption={t(dict.game.critics, { count: game.criticCount })}
            href={`${base}/criticas`}
          />
          <ScoreBadge
            variant="hero"
            kind="user"
            value={game.userScore}
            label={dict.game.public}
            caption={t(dict.game.ratings, { count: formatCount(game.userCount, lang) })}
            href={`${base}/publico`}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <PlayStatusButtons
            labels={{
              playing: dict.game.statusPlaying,
              finished: dict.game.statusFinished,
              wishlist: dict.game.statusWishlist,
            }}
          />
          <ButtonLink variant="primary" href={`${base}/avaliar`}>
            {dict.game.writeReview}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

function CalendarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="5" width="18" height="16" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}
