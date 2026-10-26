/** Interpola "{count} notas" → "12 notas". Puro: pode ser usado em Client Components. */
export function t(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}
