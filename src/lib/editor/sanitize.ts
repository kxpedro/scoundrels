import type { JSONContent } from "@tiptap/core";

const ALLOWED_NODES = new Set([
  "doc",
  "paragraph",
  "text",
  "heading",
  "blockquote",
  "bulletList",
  "orderedList",
  "listItem",
  "hardBreak",
  "horizontalRule",
]);
const ALLOWED_MARKS = new Set(["bold", "italic", "strike", "link"]);
const SAFE_HREF = /^(https?:\/\/|mailto:)/i;

/**
 * Filtra o JSON vindo do cliente: só nós/marcas conhecidos, links http(s)/mailto
 * e atributos mínimos. Server Actions recebem dados arbitrários, então nunca confiar no editor.
 */
export function sanitizeDoc(input: unknown): JSONContent {
  const clean = (node: unknown): JSONContent | null => {
    if (!node || typeof node !== "object") return null;
    const n = node as JSONContent;
    if (!n.type || !ALLOWED_NODES.has(n.type)) return null;

    const out: JSONContent = { type: n.type };
    if (n.type === "text") {
      if (typeof n.text !== "string" || !n.text) return null;
      out.text = n.text.slice(0, 20_000);
      const marks = (n.marks ?? []).flatMap((m) => {
        if (!m || !ALLOWED_MARKS.has(m.type)) return [];
        if (m.type !== "link") return [{ type: m.type }];
        const href = String(m.attrs?.href ?? "");
        return SAFE_HREF.test(href) ? [{ type: "link", attrs: { href } }] : [];
      });
      if (marks.length) out.marks = marks;
      return out;
    }
    if (n.type === "heading") {
      out.attrs = { level: n.attrs?.level === 3 ? 3 : 2 };
    }
    if (n.type === "orderedList" && typeof n.attrs?.start === "number") {
      out.attrs = { start: Math.max(1, Math.floor(n.attrs.start)) };
    }
    if (Array.isArray(n.content)) {
      const children = n.content.map(clean).filter((c): c is JSONContent => c !== null);
      if (children.length) out.content = children;
    }
    return out;
  };

  const doc = clean(input);
  return doc?.type === "doc" ? doc : { type: "doc", content: [] };
}

export function docText(doc: JSONContent | null | undefined): string {
  if (!doc) return "";
  if (doc.type === "text") return doc.text ?? "";
  return (doc.content ?? []).map(docText).join(" ");
}

export function wordCount(doc: JSONContent | null | undefined): number {
  const text = docText(doc).trim();
  return text ? text.split(/\s+/).length : 0;
}
