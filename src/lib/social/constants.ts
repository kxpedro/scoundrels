export const likeKinds = ["critic", "user", "list"] as const;
export type LikeKind = (typeof likeKinds)[number];

export const commentKinds = ["critic", "user"] as const;
export type CommentKind = (typeof commentKinds)[number];

export const COMMENT_MAX_CHARS = 1000;
export const LIST_MAX_ITEMS = 100;

/** Status de jogo ↔ slug de URL (/u/<handle>/<slug>). */
export const playStatusSlugs = {
  playing: "jogando",
  finished: "zerados",
  wishlist: "quero-jogar",
  dropped: "abandonados",
} as const;
export type PlayStatus = keyof typeof playStatusSlugs;
export const playStatuses = Object.keys(playStatusSlugs) as PlayStatus[];

export function statusFromSlug(slug: string): PlayStatus | null {
  return (Object.entries(playStatusSlugs).find(([, s]) => s === slug)?.[0] as PlayStatus | undefined) ?? null;
}

/** Handle: minúsculas, números, ponto, hífen e sublinhado; 3 a 30 caracteres. */
export const HANDLE_PATTERN = /^[a-z0-9][a-z0-9._-]{1,28}[a-z0-9]$/;
