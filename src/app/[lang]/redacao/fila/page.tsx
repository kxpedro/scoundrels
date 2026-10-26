import { Guard } from "@/components/newsroom/guard";
import { NewsroomPageHeader } from "@/components/newsroom/page-header";
import { ReviewsTable } from "@/components/newsroom/reviews-table";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { listNewsroomReviews } from "@/lib/newsroom/queries";

export default function ReviewQueuePage() {
  return (
    <Guard role="editor">
      {async (session) => {
        const [lang, dict, rows] = await Promise.all([
          getLocale(),
          getDictionary(),
          listNewsroomReviews({ id: session.user.id, role: session.user.role }, { status: ["in_review"], limit: 200 }),
        ]);
        return (
          <>
            <NewsroomPageHeader title={dict.newsroom.nav.queue} lead={dict.newsroom.queueLead} />
            <ReviewsTable rows={rows} lang={lang} dict={dict} />
          </>
        );
      }}
    </Guard>
  );
}
