import { Guard } from "@/components/newsroom/guard";
import { NewsroomPageHeader } from "@/components/newsroom/page-header";
import { ReviewsTable } from "@/components/newsroom/reviews-table";
import { ButtonLink } from "@/components/ui/button";
import { path } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { listNewsroomReviews } from "@/lib/newsroom/queries";

export default function MyReviewsPage() {
  return (
    <Guard role="critic">
      {async (session) => {
        const [lang, dict, rows] = await Promise.all([
          getLocale(),
          getDictionary(),
          listNewsroomReviews({ id: session.user.id, role: session.user.role }, { mine: true, limit: 200 }),
        ]);
        const nr = dict.newsroom;
        return (
          <>
            <NewsroomPageHeader
              title={nr.nav.mine}
              lead={nr.mineLead}
              action={
                <ButtonLink variant="primary" href={path(lang, "/redacao/reviews/nova")}>
                  {nr.newReview}
                </ButtonLink>
              }
            />
            <ReviewsTable rows={rows} lang={lang} dict={dict} />
          </>
        );
      }}
    </Guard>
  );
}
