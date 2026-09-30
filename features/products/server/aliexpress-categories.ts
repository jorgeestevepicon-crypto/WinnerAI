import "server-only";
import { unstable_cache } from "next/cache";
import { getAliExpressCategories, type AliExpressCategory } from "@/lib/aliexpress/categories";

/**
 * AliExpress's category tree is global to the marketplace, not per-user, so
 * it's shared across every user for a day rather than re-fetched (and
 * risking rate limits) on every Product Finder page load. The cache entry
 * is keyed only by a fixed string, not by whichever user's access token
 * happens to trigger the fetch — any valid token returns the same tree.
 */
export async function getCachedAliExpressCategories(accessToken: string): Promise<AliExpressCategory[]> {
  const cached = unstable_cache(async () => getAliExpressCategories(accessToken), ["aliexpress-categories"], {
    revalidate: 60 * 60 * 24,
  });

  const result = await cached();
  if (result.length > 0) return result;

  // Don't let an empty result (endpoint error, unrecognized fields, a
  // transient hiccup) get stuck in the shared cache for a full day — retry
  // live so a fix or a one-off failure recovers on the very next request.
  return getAliExpressCategories(accessToken);
}
