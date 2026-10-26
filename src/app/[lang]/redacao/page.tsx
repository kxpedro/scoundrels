import { NewsroomPageHeader } from "@/components/newsroom/page-header";
import { Guard } from "@/components/newsroom/guard";
import { ReviewsTable } from "@/components/newsroom/reviews-table";
import { statusStyle } from "@/components/newsroom/status-tag";
import { ButtonLink } from "@/components/ui/button";
import { path } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import { getDashboardStats, listNewsroomReviews } from "@/lib/newsroom/queries";

export default function NewsroomDashboard() {
  return (
    <Guard role="critic">
      {async (session) => {
        const actor = { id: session.user.id, role: session.user.role };
        const [lang, dict, stats, recent] = await Promise.all([
          getLocale(),
          getDictionary(),
          getDashboardStats(actor),
          listNewsroomReviews(actor, { limit: 12 }),
        ]);
        const nr = dict.newsroom;

        const cards = [
          { key: "draft", label: nr.stats.draft, n: stats.draft, style: statusStyle.draft },
          { key: "in_review", label: nr.stats.in_review, n: stats.in_review, style: statusStyle.in_review },
          { key: "changes_requested", label: nr.stats.changes_requested, n: stats.changes_requested, style: statusStyle.changes_requested },
          { key: "published", label: nr.stats.published_month, n: stats.published_month, style: statusStyle.published },
        ];

        return (
          <>
            <NewsroomPageHeader
              title={nr.nav.dashboard}
              action={
                <ButtonLink variant="primary" href={path(lang, "/redacao/reviews/nova")}>
                  {nr.newReview}
                </ButtonLink>
              }
            />
            <div className="mb-6 grid grid-cols-2 gap-2 lg:grid-cols-4">
              {cards.map((c) => (
                <div key={c.key} className={cn("chamfer border-t-2 bg-panel px-3 py-2.5", c.style.border)}>
                  <div className={cn("label-mono text-[10px]", c.style.text)}>{c.label}</div>
                  <div className="font-score text-2xl font-bold text-fg">{c.n}</div>
                </div>
              ))}
            </div>
            <ReviewsTable rows={recent} lang={lang} dict={dict} />
          </>
        );
      }}
    </Guard>
  );
}
