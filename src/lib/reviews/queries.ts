import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { gameStatuses, userReviews } from "@/db/schema";

/** Review e status do próprio usuário para um jogo (por requisição, nunca cacheado). */
export async function getMyReview(userId: string, gameId: string) {
  const [[review], [status]] = await Promise.all([
    db
      .select({
        id: userReviews.id,
        score: userReviews.score,
        body: userReviews.body,
        hasSpoilers: userReviews.hasSpoilers,
        visibility: userReviews.visibility,
        createdAt: userReviews.createdAt,
      })
      .from(userReviews)
      .where(and(eq(userReviews.userId, userId), eq(userReviews.gameId, gameId)))
      .limit(1),
    db
      .select({ status: gameStatuses.status })
      .from(gameStatuses)
      .where(and(eq(gameStatuses.userId, userId), eq(gameStatuses.gameId, gameId)))
      .limit(1),
  ]);
  return { review: review ?? null, status: status?.status ?? null };
}
