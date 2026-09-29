import "server-only";
import { env } from "@/config/env";

/**
 * Meta's public Ad Library API (`ads_archive`) — official and free, but it
 * needs a Graph API access token from an app that has completed Meta's
 * identity confirmation for ad-transparency data (see .env.example).
 *
 * Real, load-bearing limitation, not a bug: Meta's own disclosure rules
 * mean `ad_reached_countries=["US"]` only ever surfaces
 * POLITICAL_AND_ISSUE ads. Ordinary commercial ads — what we actually want
 * here — are only visible for countries covered by the EU/UK's ad
 * transparency rules (the Digital Services Act), regardless of what
 * country the product itself is sold in. So this always queries against
 * "GB" rather than the product's own target country.
 */
const GRAPH_VERSION = "v21.0";
const AD_LIBRARY_COUNTRY = "GB";

interface AdArchiveEntry {
  id: string;
  page_id?: string;
}

async function fetchAdsArchive(searchTerm: string): Promise<AdArchiveEntry[]> {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/ads_archive`);
  url.searchParams.set("access_token", env.metaAds.accessToken!);
  url.searchParams.set("search_terms", searchTerm);
  url.searchParams.set("ad_reached_countries", JSON.stringify([AD_LIBRARY_COUNTRY]));
  url.searchParams.set("ad_type", "ALL");
  url.searchParams.set("ad_active_status", "ACTIVE");
  url.searchParams.set("fields", "id,page_id");
  url.searchParams.set("limit", "100");

  const response = await fetch(url.toString());
  const data = await response.json();
  if (!response.ok || data?.error) {
    throw new Error(`Meta Ad Library returned an error: ${JSON.stringify(data?.error ?? data)}`);
  }
  return Array.isArray(data?.data) ? data.data : [];
}

/**
 * Real ad-market signal for `searchTerm`: how many active commercial ads on
 * Meta currently mention it (-> competition) and how many distinct
 * advertiser Pages are running them (-> saturation), log-scaled the same
 * way the AliExpress adapter scales real order-volume. Never returns a
 * confident "zero competition" — a genuine zero-ad response and an
 * API/access failure both come back as null, since (per the country
 * limitation above) we usually can't tell "nobody's advertising this" from
 * "this API can't see commercial ads here", and a false "low competition"
 * would be worse than surfacing no signal at all.
 */
export async function getMetaAdsSignal(searchTerm: string): Promise<{ competition: number; saturation: number } | null> {
  try {
    const ads = await fetchAdsArchive(searchTerm);
    if (ads.length === 0) return null;

    const uniquePages = new Set(ads.map((ad) => ad.page_id).filter(Boolean)).size;

    // Matching ad counts can range from a handful to thousands, so a linear
    // scale would max out almost instantly — 200+ matching active ads (or
    // 50+ distinct advertiser pages) scores ~100.
    const competition = Math.round(Math.min(100, (Math.log10(ads.length + 1) / Math.log10(200)) * 100));
    const saturation = Math.round(Math.min(100, (Math.log10(uniquePages + 1) / Math.log10(50)) * 100));

    return { competition, saturation };
  } catch (error) {
    console.error(`Meta Ad Library lookup failed for "${searchTerm}" — skipping competition/saturation signal.`, error);
    return null;
  }
}
