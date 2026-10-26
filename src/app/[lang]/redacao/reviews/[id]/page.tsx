import type { JSONContent } from "@tiptap/core";
import { forbidden, notFound } from "next/navigation";
import { z } from "zod";
import { Guard } from "@/components/newsroom/guard";
import { ReviewEditor } from "@/components/newsroom/review-editor";
import { path } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { canDecide, canEdit, canSubmit, canView } from "@/lib/newsroom/permissions";
import { getReviewForEdit } from "@/lib/newsroom/queries";

export default function EditReviewPage(props: PageProps<"/[lang]/redacao/reviews/[id]">) {
  return (
    <Guard role="critic">
      {async (session) => {
        const { id } = await props.params;
        if (!z.uuid().safeParse(id).success) notFound();

        const [data, lang, dict] = await Promise.all([getReviewForEdit(id), getLocale(), getDictionary()]);
        if (!data) notFound();

        const me = { id: session.user.id, role: session.user.role };
        const { review } = data;
        if (!canView(me, review)) forbidden();

        return (
          <ReviewEditor
            // Recria o editor quando o status muda (ex.: depois de enviar/publicar), aplicando novas permissões.
            key={`${review.id}:${review.status}`}
            review={{
              id: review.id,
              status: review.status,
              title: review.title,
              excerpt: review.excerpt,
              score: review.score,
              platformTestedId: review.platformTestedId,
              pros: review.pros,
              cons: review.cons,
              body: review.body as JSONContent | null,
              editorNote: review.editorNote,
              editorName: data.editorName,
              publicUrl: review.status === "published" ? path(lang, `/reviews/${review.slug}`) : null,
            }}
            game={{ title: data.game.title, year: data.game.releaseDate?.slice(0, 4) ?? null }}
            platformOptions={data.platformOptions}
            permissions={{ edit: canEdit(me, review), submit: canSubmit(me, review), decide: canDecide(me, review) }}
            labels={dict.newsroom}
          />
        );
      }}
    </Guard>
  );
}
