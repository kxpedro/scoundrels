import "server-only";

/**
 * Cliente mínimo da API do IGDB (Twitch).
 * Docs: https://api-docs.igdb.com — auth por client credentials, limite de 4 req/s.
 */

export class IgdbNotConfiguredError extends Error {
  constructor() {
    super("IGDB_CLIENT_ID / IGDB_CLIENT_SECRET não configurados");
  }
}

export function igdbConfigured(): boolean {
  return Boolean(process.env.IGDB_CLIENT_ID && process.env.IGDB_CLIENT_SECRET);
}

// Token de app (~60 dias). Guardado em memória da instância; renovado com folga.
let token: { value: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (token && token.expiresAt > Date.now() + 60_000) return token.value;

  const id = process.env.IGDB_CLIENT_ID;
  const secret = process.env.IGDB_CLIENT_SECRET;
  if (!id || !secret) throw new IgdbNotConfiguredError();

  const params = new URLSearchParams({ client_id: id, client_secret: secret, grant_type: "client_credentials" });
  const res = await fetch(`https://id.twitch.tv/oauth2/token?${params}`, { method: "POST", cache: "no-store" });
  if (!res.ok) throw new Error(`Falha ao autenticar no IGDB (${res.status})`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  token = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return token.value;
}

async function query<T>(endpoint: string, body: string): Promise<T> {
  const res = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
    method: "POST",
    headers: {
      "Client-ID": process.env.IGDB_CLIENT_ID!,
      Authorization: `Bearer ${await getToken()}`,
      Accept: "application/json",
    },
    body,
    cache: "no-store",
  });
  if (res.status === 401) token = null; // token revogado: força renovar na próxima
  if (!res.ok) throw new Error(`IGDB ${endpoint} respondeu ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export type IgdbGame = {
  id: number;
  name: string;
  slug: string;
  summary?: string;
  first_release_date?: number;
  total_rating_count?: number;
  cover?: { image_id: string };
  genres?: Array<{ id: number; name: string; slug: string }>;
  platforms?: Array<{ id: number; name: string; slug: string; abbreviation?: string }>;
  involved_companies?: Array<{
    developer: boolean;
    publisher: boolean;
    company: { id: number; name: string; slug: string };
  }>;
};

const GAME_FIELDS = [
  "name",
  "slug",
  "summary",
  "first_release_date",
  "total_rating_count",
  "cover.image_id",
  "genres.name",
  "genres.slug",
  "platforms.name",
  "platforms.slug",
  "platforms.abbreviation",
  "involved_companies.developer",
  "involved_companies.publisher",
  "involved_companies.company.name",
  "involved_companies.company.slug",
].join(",");

/** Escapa a string para a linguagem de consulta do IGDB (apocalypseo). */
function quote(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export async function searchIgdbGames(term: string): Promise<IgdbGame[]> {
  // version_parent = null remove edições (GOTY, Deluxe…); game_type 0 = jogo principal, 8 = remake, 9 = remaster.
  const results = await query<IgdbGame[]>(
    "games",
    `search ${quote(term.slice(0, 100))}; fields ${GAME_FIELDS}; where version_parent = null & game_type = (0,8,9); limit 20;`,
  );
  // "search" do IGDB não aceita sort; ordena por popularidade aqui para o jogo conhecido aparecer primeiro.
  return results.sort((a, b) => (b.total_rating_count ?? 0) - (a.total_rating_count ?? 0)).slice(0, 12);
}

export async function getIgdbGame(id: number): Promise<IgdbGame | null> {
  const [game] = await query<IgdbGame[]>("games", `fields ${GAME_FIELDS}; where id = ${Math.floor(id)}; limit 1;`);
  return game ?? null;
}

export { igdbCoverUrl } from "./igdb-images";

/** Nomes PT dos gêneros do IGDB (o IGDB só fornece inglês). Slug → nome. */
export const genreNamesPt: Record<string, string> = {
  "point-and-click": "Point-and-click",
  fighting: "Luta",
  shooter: "Tiro",
  music: "Música",
  platform: "Plataforma",
  puzzle: "Quebra-cabeça",
  racing: "Corrida",
  "real-time-strategy-rts": "Estratégia em tempo real",
  "role-playing-rpg": "RPG",
  simulator: "Simulação",
  sport: "Esporte",
  strategy: "Estratégia",
  "turn-based-strategy-tbs": "Estratégia por turnos",
  tactical: "Tático",
  "hack-and-slash-beat-em-up": "Hack and slash",
  "quiz-trivia": "Quiz",
  pinball: "Pinball",
  adventure: "Aventura",
  indie: "Indie",
  arcade: "Arcade",
  "visual-novel": "Visual novel",
  "card-and-board-game": "Cartas e tabuleiro",
  moba: "MOBA",
};
