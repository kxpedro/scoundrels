import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  serial,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/* ───────────────────────── Enums ───────────────────────── */

export const userRole = pgEnum("user_role", ["user", "critic", "editor", "admin"]);
export const locale = pgEnum("locale", ["pt", "en"]);
export const criticReviewStatus = pgEnum("critic_review_status", [
  "draft",
  "in_review",
  "changes_requested",
  "published",
  "archived",
]);
export type CriticReviewStatus = (typeof criticReviewStatus.enumValues)[number];
export const visibility = pgEnum("visibility", ["visible", "hidden"]);
export const reviewKind = pgEnum("review_kind", ["critic", "user"]);
export const reportTarget = pgEnum("report_target", ["user_review", "comment"]);
export const reportStatus = pgEnum("report_status", ["open", "resolved", "dismissed"]);
export const playStatus = pgEnum("play_status", ["playing", "finished", "wishlist", "dropped"]);
export const studioRole = pgEnum("studio_role", ["developer", "publisher"]);

/* ─────────────── Auth (formato esperado pelo Better Auth) ─────────────── */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  // Campos próprios do Scoundrels
  handle: text("handle").unique(),
  role: userRole("role").notNull().default("user"),
  /** Cargo exibido na assinatura do crítico ("Editor-chefe", "Crítica"). */
  title: text("title"),
  bio: text("bio"),
  ...timestamps,
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ...timestamps,
});

/* ───────────────────────── Catálogo ───────────────────────── */

export const games = pgTable(
  "games",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    igdbId: integer("igdb_id").unique(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    summary: text("summary"),
    coverUrl: text("cover_url"),
    releaseDate: date("release_date"),
    // Agregados recalculados a cada publicação/review (leitura rápida)
    criticScore: real("critic_score"),
    criticCount: integer("critic_count").notNull().default(0),
    userScore: real("user_score"),
    userCount: integer("user_count").notNull().default(0),
    userPositive: integer("user_positive").notNull().default(0),
    userMixed: integer("user_mixed").notNull().default(0),
    userNegative: integer("user_negative").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("games_release_idx").on(t.releaseDate), index("games_critic_score_idx").on(t.criticScore)],
);

export const genres = pgTable("genres", {
  id: serial("id").primaryKey(),
  igdbId: integer("igdb_id").unique(),
  slug: text("slug").notNull().unique(),
  namePt: text("name_pt").notNull(),
  nameEn: text("name_en").notNull(),
});

export const platforms = pgTable("platforms", {
  id: serial("id").primaryKey(),
  igdbId: integer("igdb_id").unique(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  /** Rótulo curto da tag ("PS5", "XBOX SERIES"). */
  shortName: text("short_name"),
});

export const studios = pgTable("studios", {
  id: serial("id").primaryKey(),
  igdbId: integer("igdb_id").unique(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
});

export const gameGenres = pgTable(
  "game_genres",
  {
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    genreId: integer("genre_id")
      .notNull()
      .references(() => genres.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.gameId, t.genreId] }), index("game_genres_genre_idx").on(t.genreId)],
);

export const gamePlatforms = pgTable(
  "game_platforms",
  {
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    platformId: integer("platform_id")
      .notNull()
      .references(() => platforms.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.gameId, t.platformId] }), index("game_platforms_platform_idx").on(t.platformId)],
);

export const gameStudios = pgTable(
  "game_studios",
  {
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    studioId: integer("studio_id")
      .notNull()
      .references(() => studios.id, { onDelete: "cascade" }),
    role: studioRole("role").notNull(),
  },
  (t) => [primaryKey({ columns: [t.gameId, t.studioId, t.role] }), index("game_studios_studio_idx").on(t.studioId)],
);

/* ───────────────────────── Reviews ───────────────────────── */

const scoreCheck = (name: string, column: unknown) =>
  check(name, sql`${column} >= 0 and ${column} <= 10 and mod((${column} * 2)::numeric, 1) = 0`);

export const criticReviews = pgTable(
  "critic_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id),
    slug: text("slug").notNull().unique(),
    locale: locale("locale").notNull().default("pt"),
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    /** Documento do editor (Tiptap/ProseMirror JSON). */
    body: jsonb("body"),
    score: real("score"),
    pros: text("pros").array().notNull().default(sql`'{}'::text[]`),
    cons: text("cons").array().notNull().default(sql`'{}'::text[]`),
    platformTestedId: integer("platform_tested_id").references(() => platforms.id),
    status: criticReviewStatus("status").notNull().default("draft"),
    /** Editor que aprovou/publicou e nota de revisão devolvida ao crítico. */
    editorId: text("editor_id").references(() => user.id),
    editorNote: text("editor_note"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    likeCount: integer("like_count").notNull().default(0),
    commentCount: integer("comment_count").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    index("critic_reviews_game_idx").on(t.gameId, t.status),
    index("critic_reviews_author_idx").on(t.authorId),
    // Um crítico publica uma review por jogo e idioma
    uniqueIndex("critic_reviews_author_game_locale_uq").on(t.authorId, t.gameId, t.locale),
    scoreCheck("critic_reviews_score_ck", t.score),
  ],
);

export const userReviews = pgTable(
  "user_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    score: real("score").notNull(),
    body: text("body"),
    locale: locale("locale").notNull().default("pt"),
    visibility: visibility("visibility").notNull().default("visible"),
    likeCount: integer("like_count").notNull().default(0),
    commentCount: integer("comment_count").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("user_reviews_game_user_uq").on(t.gameId, t.userId),
    index("user_reviews_game_idx").on(t.gameId, t.visibility),
    scoreCheck("user_reviews_score_ck", t.score),
  ],
);

/* ───────────────────────── Social ───────────────────────── */

export const reviewLikes = pgTable(
  "review_likes",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    reviewKind: reviewKind("review_kind").notNull(),
    reviewId: uuid("review_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.reviewKind, t.reviewId] }), index("review_likes_review_idx").on(t.reviewKind, t.reviewId)],
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reviewKind: reviewKind("review_kind").notNull(),
    reviewId: uuid("review_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    visibility: visibility("visibility").notNull().default("visible"),
    ...timestamps,
  },
  (t) => [index("comments_review_idx").on(t.reviewKind, t.reviewId, t.createdAt)],
);

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    target: reportTarget("target").notNull(),
    targetId: uuid("target_id").notNull(),
    reporterId: text("reporter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    status: reportStatus("status").notNull().default("open"),
    resolvedById: text("resolved_by_id").references(() => user.id),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("reports_status_idx").on(t.status, t.createdAt),
    uniqueIndex("reports_reporter_target_uq").on(t.reporterId, t.target, t.targetId),
  ],
);

export const gameStatuses = pgTable(
  "game_statuses",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    status: playStatus("status").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [primaryKey({ columns: [t.userId, t.gameId] }), index("game_statuses_user_status_idx").on(t.userId, t.status)],
);

export const lists = pgTable(
  "lists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    isPublic: boolean("is_public").notNull().default(true),
    likeCount: integer("like_count").notNull().default(0),
    ...timestamps,
  },
  (t) => [uniqueIndex("lists_user_slug_uq").on(t.userId, t.slug)],
);

export const listItems = pgTable(
  "list_items",
  {
    listId: uuid("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    position: smallint("position").notNull(),
    note: text("note"),
  },
  (t) => [primaryKey({ columns: [t.listId, t.gameId] })],
);

export const follows = pgTable(
  "follows",
  {
    followerId: text("follower_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    followingId: text("following_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.followerId, t.followingId] }),
    index("follows_following_idx").on(t.followingId),
    check("follows_not_self_ck", sql`${t.followerId} <> ${t.followingId}`),
  ],
);
