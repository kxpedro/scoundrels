/** URL de capa do IGDB (pura, usável no cliente e no servidor). */
export function igdbCoverUrl(imageId: string, size: "t_cover_big" | "t_cover_small" = "t_cover_big"): string {
  return `https://images.igdb.com/igdb/image/upload/${size}/${imageId}.jpg`;
}

/** Só capas do IGDB passam pelo otimizador de imagens; URLs próprias vão direto (evita proxy aberto). */
export function isOptimizableCover(url: string): boolean {
  return url.startsWith("https://images.igdb.com/");
}
