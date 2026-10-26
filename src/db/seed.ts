/**
 * Dados fictícios para desenvolvimento: npm run db:seed
 * Idempotente — apaga e recria o catálogo e as reviews de exemplo.
 */
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { inArray } from "drizzle-orm";
import postgres from "postgres";
import { recomputeGameScores } from "./aggregates";
import * as s from "./schema";

config({ path: ".env.local" });

const client = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(client, { schema: s });

const critics = [
  { id: "seed-critic-rm", name: "Rafael Mendes", handle: "rafael-mendes", role: "admin" as const, title: "Editor-chefe" },
  { id: "seed-critic-la", name: "Luana Araújo", handle: "luana-araujo", role: "editor" as const, title: "Editora" },
  { id: "seed-critic-tk", name: "Taro Kobayashi", handle: "taro-kobayashi", role: "critic" as const, title: null },
];
const players = ["vex_hollow", "kira.exe", "n0va", "ghostwire_br", "pixelmonge", "lady.byte"].map((h) => ({
  id: `seed-user-${h}`,
  name: h,
  handle: h,
  role: "user" as const,
  title: null,
}));

const genreSeed = [
  { slug: "rpg-de-acao", namePt: "RPG de ação", nameEn: "Action RPG" },
  { slug: "soulslike", namePt: "Soulslike", nameEn: "Soulslike" },
  { slug: "mundo-aberto", namePt: "Mundo aberto", nameEn: "Open world" },
  { slug: "roguelike", namePt: "Roguelike", nameEn: "Roguelike" },
  { slug: "tiro", namePt: "Tiro", nameEn: "Shooter" },
];
const platformSeed = [
  { slug: "ps5", name: "PlayStation 5", shortName: "PS5" },
  { slug: "xbox-series", name: "Xbox Series X|S", shortName: "XBOX SERIES" },
  { slug: "pc", name: "PC", shortName: "PC" },
  { slug: "switch-2", name: "Nintendo Switch 2", shortName: "SWITCH 2" },
];
const studioSeed = [
  { slug: "ironveil-studios", name: "Ironveil Studios" },
  { slug: "halcyon-interactive", name: "Halcyon Interactive" },
  { slug: "pale-moth", name: "Pale Moth" },
];

type GameSeed = {
  slug: string;
  title: string;
  summary: string;
  releaseDate: string;
  genres: string[];
  platforms: string[];
  developer: string;
  publisher: string;
  critic: Array<[handle: string, score: number, title: string, excerpt: string]>;
  users: Array<[handle: string, score: number, body: string | null, status: "playing" | "finished" | "dropped" | null, likes: number]>;
};

const gameSeed: GameSeed[] = [
  {
    slug: "echoes-of-ashfall",
    title: "Echoes of Ashfall",
    summary: "Um RPG de ação sombrio sobre um reino soterrado em cinzas.",
    releaseDate: "2026-03-14",
    genres: ["rpg-de-acao", "soulslike", "mundo-aberto"],
    platforms: ["ps5", "xbox-series", "pc"],
    developer: "ironveil-studios",
    publisher: "halcyon-interactive",
    critic: [
      ["rafael-mendes", 9, "Um combate que pune e recompensa na mesma medida", "O sistema de postura transforma cada chefe num duelo de leitura."],
      ["luana-araujo", 8.5, "O soulslike mais acessível da geração", "Ajustes de dificuldade inteligentes sem trair o gênero."],
      ["taro-kobayashi", 6.5, "Bonito, mas pede paciência demais", "A história demora a engrenar e o PC sofre com quedas de quadros."],
    ],
    users: [
      ["vex_hollow", 10, "Platinei e começaria de novo agora. O último chefe é a melhor luta que joguei desde Sekiro.", "finished", 214],
      ["kira.exe", 5, "Lindo, mas os 30fps no modo qualidade estragam o combate. Esperando patch.", "playing", 87],
      ["n0va", 7.5, "Mundo aberto incrível, mas o terceiro ato perde fôlego. Ainda assim, recomendo.", "finished", 41],
      ["ghostwire_br", 2.5, "Crashou quatro vezes no PC em duas horas. Não dá para avaliar além disso.", "dropped", 63],
      ["pixelmonge", 9, null, "finished", 3],
      ["lady.byte", 8, "Direção de arte absurda.", "playing", 12],
    ],
  },
  {
    slug: "rust-saint",
    title: "Rust Saint",
    summary: "Um cavaleiro mecânico enferrujado atravessa catedrais flutuantes.",
    releaseDate: "2026-01-22",
    genres: ["rpg-de-acao", "soulslike"],
    platforms: ["ps5", "pc"],
    developer: "pale-moth",
    publisher: "pale-moth",
    critic: [
      ["rafael-mendes", 9, "Ferrugem nunca foi tão elegante", "Level design vertical de primeira."],
      ["taro-kobayashi", 8.5, "Pequeno no orçamento, enorme na ambição", "Um indie que encara os grandes."],
    ],
    users: [
      ["vex_hollow", 9, "Chefes memoráveis.", "finished", 30],
      ["n0va", 8, null, "finished", 2],
    ],
  },
  {
    slug: "pale-orbit",
    title: "Pale Orbit",
    summary: "Roguelike espacial de tiro em gravidade zero.",
    releaseDate: "2025-11-05",
    genres: ["roguelike", "tiro"],
    platforms: ["pc", "switch-2"],
    developer: "pale-moth",
    publisher: "halcyon-interactive",
    critic: [["luana-araujo", 8, "Viciante como deve ser", "Cada run ensina algo novo."]],
    users: [
      ["kira.exe", 6, "Repetitivo depois de 20h.", "dropped", 9],
      ["lady.byte", 7, null, "playing", 1],
    ],
  },
  {
    slug: "grimvault",
    title: "Grimvault",
    summary: "Masmorras procedurais e um baú que fala demais.",
    releaseDate: "2025-09-18",
    genres: ["roguelike", "rpg-de-acao"],
    platforms: ["pc", "ps5", "xbox-series"],
    developer: "ironveil-studios",
    publisher: "halcyon-interactive",
    critic: [["taro-kobayashi", 7, "Divertido, mas raso", "Boa base que pede mais conteúdo."]],
    users: [
      ["ghostwire_br", 7.5, "Melhor em co-op.", "playing", 5],
      ["pixelmonge", 7, null, null, 0],
    ],
  },
  {
    slug: "neon-requiem",
    title: "Neon Requiem",
    summary: "Shooter cyberpunk em mundo aberto com sérios problemas técnicos.",
    releaseDate: "2025-12-02",
    genres: ["tiro", "mundo-aberto"],
    platforms: ["ps5", "xbox-series", "pc"],
    developer: "halcyon-interactive",
    publisher: "halcyon-interactive",
    critic: [["rafael-mendes", 4.5, "Promessa quebrada em néon", "Bugs demais para uma cidade tão bonita."]],
    users: [
      ["vex_hollow", 3, "Lançaram cedo demais.", "dropped", 120],
      ["n0va", 4.5, null, "dropped", 4],
      ["lady.byte", 6, "Depois do patch 1.2 melhorou.", "playing", 18],
    ],
  },
];

async function main() {
  console.log("Limpando dados de exemplo…");
  await db.delete(s.games); // cascade: reviews, relações e status
  await db.delete(s.genres);
  await db.delete(s.platforms);
  await db.delete(s.studios);
  await db.delete(s.user).where(inArray(s.user.id, [...critics, ...players].map((u) => u.id)));

  console.log("Usuários…");
  await db.insert(s.user).values(
    [...critics, ...players].map((u) => ({ ...u, email: `${u.handle}@seed.scoundrels.local`, emailVerified: true })),
  );
  const userId = new Map([...critics, ...players].map((u) => [u.handle, u.id]));

  console.log("Catálogo…");
  const genreRows = await db.insert(s.genres).values(genreSeed).returning();
  const platformRows = await db.insert(s.platforms).values(platformSeed).returning();
  const studioRows = await db.insert(s.studios).values(studioSeed).returning();
  const genreId = new Map(genreRows.map((r) => [r.slug, r.id]));
  const platformId = new Map(platformRows.map((r) => [r.slug, r.id]));
  const studioId = new Map(studioRows.map((r) => [r.slug, r.id]));

  const day = 86_400_000;
  for (const g of gameSeed) {
    const [game] = await db
      .insert(s.games)
      .values({ slug: g.slug, title: g.title, summary: g.summary, releaseDate: g.releaseDate })
      .returning();

    await db.insert(s.gameGenres).values(g.genres.map((slug) => ({ gameId: game.id, genreId: genreId.get(slug)! })));
    await db.insert(s.gamePlatforms).values(g.platforms.map((slug) => ({ gameId: game.id, platformId: platformId.get(slug)! })));
    await db.insert(s.gameStudios).values([
      { gameId: game.id, studioId: studioId.get(g.developer)!, role: "developer" as const },
      ...(g.publisher !== g.developer
        ? [{ gameId: game.id, studioId: studioId.get(g.publisher)!, role: "publisher" as const }]
        : []),
    ]);

    const published = new Date(`${g.releaseDate}T12:00:00Z`);
    await db.insert(s.criticReviews).values(
      g.critic.map(([handle, score, title, excerpt]) => ({
        gameId: game.id,
        authorId: userId.get(handle)!,
        slug: `${g.slug}-${handle}`,
        title,
        excerpt,
        score,
        status: "published" as const,
        editorId: userId.get("rafael-mendes")!,
        submittedAt: published,
        publishedAt: published,
      })),
    );

    await db.insert(s.userReviews).values(
      g.users.map(([handle, score, body, , likes], i) => ({
        gameId: game.id,
        userId: userId.get(handle)!,
        score,
        body,
        likeCount: likes,
        commentCount: Math.floor(likes / 8),
        createdAt: new Date(Date.now() - (i * 3 + 2) * day),
      })),
    );

    const statuses = g.users.filter(([, , , status]) => status);
    if (statuses.length) {
      await db.insert(s.gameStatuses).values(
        statuses.map(([handle, , , status]) => ({ userId: userId.get(handle)!, gameId: game.id, status: status! })),
      );
    }

    await recomputeGameScores(db, game.id);
  }

  console.log(`Pronto: ${gameSeed.length} jogos, ${critics.length} críticos, ${players.length} jogadores.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => client.end());
