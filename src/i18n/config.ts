export const locales = ["pt", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "pt";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Monta um caminho interno com o prefixo de idioma: path(lang, "/jogos") → "/pt/jogos". */
export function path(lang: Locale, to: string): string {
  return `/${lang}${to === "/" ? "" : to}`;
}
