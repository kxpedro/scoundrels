/** Motivos fixos de denúncia (gravados em reports.reason). Rótulos em dicionário: reportReasons.<id>. */
export const reportReasons = ["spoiler", "offensive", "spam", "off_topic"] as const;
export type ReportReason = (typeof reportReasons)[number];

/** Com este número de denúncias abertas, a review sai do ar até a redação decidir. */
export const AUTO_HIDE_REPORTS = 3;

export const USER_REVIEW_MAX_CHARS = 2000;

/** Status que a pessoa pode informar ao avaliar ("quero jogar" não faz sentido com nota). */
export const reviewPlayStatuses = ["playing", "finished", "dropped"] as const;
export type ReviewPlayStatus = (typeof reviewPlayStatuses)[number];
