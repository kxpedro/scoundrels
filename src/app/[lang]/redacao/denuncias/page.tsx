import { Guard } from "@/components/newsroom/guard";
import { NewsroomPageHeader } from "@/components/newsroom/page-header";
import { Button } from "@/components/ui/button";
import { RelativeTime } from "@/components/ui/relative-time";
import { getDictionary } from "@/i18n/dictionaries";
import { resolveReport } from "@/lib/newsroom/actions";
import { listOpenReports } from "@/lib/newsroom/queries";

export default function ReportsPage() {
  return (
    <Guard role="editor">
      {async () => {
        const [dict, rows] = await Promise.all([getDictionary(), listOpenReports()]);
        const l = dict.newsroom.reports;

        return (
          <>
            <NewsroomPageHeader title={l.title} lead={l.lead} />
            {rows.length === 0 ? (
              <p className="text-muted">{l.empty}</p>
            ) : (
              <ul className="divide-y divide-line">
                {rows.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-start justify-between gap-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="label-mono flex flex-wrap gap-2 text-[10px] text-muted">
                        <span className="text-red">{r.target === "user_review" ? "REVIEW" : "COMENTÁRIO"}</span>
                        {r.gameTitle && <span>{r.gameTitle}</span>}
                        <span>@{r.reporter}</span>
                        <RelativeTime date={r.createdAt} labels={dict.time} />
                      </div>
                      {r.excerpt && <p className="mt-1 line-clamp-3 text-fg">“{r.excerpt}”</p>}
                      <p className="mt-1 text-[13px]">
                        <span className="text-muted">{l.reason}:</span> {r.reason}
                      </p>
                    </div>
                    <form action={resolveReport} className="flex gap-2">
                      <input type="hidden" name="id" value={r.id} />
                      <Button type="submit" name="decision" value="hide" className="border-red text-red">
                        {l.hide}
                      </Button>
                      <Button type="submit" name="decision" value="dismiss">
                        {l.dismiss}
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
