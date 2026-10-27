import Image from "next/image";
import { isOptimizableCover } from "@/lib/igdb-images";
import Link from "next/link";
import { path, type Locale } from "@/i18n/config";
import { t, type Dictionary } from "@/i18n/dictionaries";
import type { ListCardData } from "@/lib/queries/social";

/** Card de lista: mosaico com até 4 capas, título, autor e contadores. */
export function ListCard({ list, lang, dict }: { list: ListCardData; lang: Locale; dict: Dictionary }) {
  const l = dict.lists;
  const handle = list.owner.handle ?? "";
  return (
    <Link href={path(lang, `/u/${handle}/listas/${list.slug}`)} className="chamfer lift-lg group block bg-panel p-3">
      <div className="grid grid-cols-4 gap-1">
        {Array.from({ length: 4 }, (_, i) => {
          const g = list.covers[i];
          return (
            <div key={i} className="relative aspect-[3/4] bg-raised">
              {g?.coverUrl && <Image src={g.coverUrl} unoptimized={!isOptimizableCover(g.coverUrl)} alt="" fill sizes="80px" className="object-cover" />}
            </div>
          );
        })}
      </div>
      <p className="mt-2.5 line-clamp-2 font-medium text-fg group-hover:text-brand">{list.title}</p>
      <p className="label-mono mt-1 flex flex-wrap gap-x-2 text-[10px] text-muted">
        <span>{t(l.by, { user: handle })}</span>
        <span>{t(list.size === 1 ? l.gamesOne : l.games, { n: list.size })}</span>
        <span>♥ {list.likeCount}</span>
        {!list.isPublic && <span className="text-amber">{l.privateBadge}</span>}
      </p>
    </Link>
  );
}
