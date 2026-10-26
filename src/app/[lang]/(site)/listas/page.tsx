import type { Metadata } from "next";
import { ListCard } from "@/components/lists/list-card";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { listPopularLists } from "@/lib/queries/social";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.lists.title, description: dict.lists.lead };
}

export default async function ListsPage() {
  const [lang, dict, lists] = await Promise.all([getLocale(), getDictionary(), listPopularLists()]);

  return (
    <section className="pt-8">
      <h1 className="font-display text-3xl text-fg">{dict.lists.title}</h1>
      <p className="mt-2 text-muted">{dict.lists.lead}</p>
      {lists.length === 0 ? (
        <p className="mt-8 text-muted">{dict.lists.emptyAll}</p>
      ) : (
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <ListCard key={list.id} list={list} lang={lang} dict={dict} />
          ))}
        </div>
      )}
    </section>
  );
}
