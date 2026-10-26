import type { JSONContent } from "@tiptap/core";
import { renderToReactElement } from "@tiptap/static-renderer";
import { reviewExtensions } from "@/lib/editor/extensions";
import { sanitizeDoc } from "@/lib/editor/sanitize";

/** Renderiza o JSON do Tiptap como React no servidor (sem HTML cru). Sanitiza de novo por segurança. */
export function ReviewBody({ doc }: { doc: unknown }) {
  const content: JSONContent = sanitizeDoc(doc);
  return <div className="review-prose">{renderToReactElement({ content, extensions: reviewExtensions })}</div>;
}
