import StarterKit from "@tiptap/starter-kit";

/**
 * Extensões do corpo da review. Usadas pelo editor (cliente) e pelo renderer estático (servidor),
 * então qualquer nó novo precisa entrar aqui e em ALLOWED_NODES (sanitize.ts).
 */
export const reviewExtensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    code: false,
    codeBlock: false,
    underline: false,
    link: {
      openOnClick: false,
      autolink: true,
      defaultProtocol: "https",
      HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
    },
  }),
];
