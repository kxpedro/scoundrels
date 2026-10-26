export type ScoreKind = "critic" | "user";
export type ScoreTone = "brand" | "cyan" | "amber" | "red";

/** Crítica Scoundrel é sempre amarela; público é colorido por faixa. */
export function scoreTone(value: number, kind: ScoreKind): ScoreTone {
  if (kind === "critic") return "brand";
  if (value >= 7) return "cyan";
  if (value >= 5) return "amber";
  return "red";
}

/** Médias sempre com uma casa ("8.0"); notas individuais sem ".0" ("10", "7.5"). */
export function formatScore(value: number, { average = false } = {}): string {
  if (average) return value.toFixed(1);
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/** Notas aceitas: 0 a 10 em passos de 0.5. */
export function isValidScore(value: number): boolean {
  return value >= 0 && value <= 10 && Number.isInteger(value * 2);
}

export type Sentiment = "positive" | "mixed" | "negative";

export function sentimentOf(value: number): Sentiment {
  if (value >= 7) return "positive";
  if (value >= 5) return "mixed";
  return "negative";
}
