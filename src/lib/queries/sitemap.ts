import "server-only";
import { eq, isNotNull } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { criticReviews, games, user } from "@/db/schema";
import { tags } from "./games";

export async function getSitemapEntries() {
  "use cache";
  cacheLife("hours");
  cacheTag(tags.games);

  const [gameRows, reviewRows, criticRows] = await Promise.all([
    db.select({ slug: games.slug, updatedAt: games.updatedAt }).from(games),
    db
      .select({ slug: criticReviews.slug, updatedAt: criticReviews.updatedAt })
      .from(criticReviews)
      .where(eq(criticReviews.status, "published")),
    db.select({ handle: user.handle, role: user.role }).from(user).where(isNotNull(user.handle)),
  ]);

  return {
    games: gameRows,
    reviews: reviewRows,
    critics: criticRows.filter((c) => c.role !== "user").map((c) => c.handle!),
  };
}
