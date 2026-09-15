import Link from "next/link";
import { Library } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getUserAdCreatives } from "@/features/ads/server/queries";
import { AdPreview } from "@/features/ads/components/ad-preview";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { LibraryFilters } from "@/features/ads/components/library-filters";

export const metadata = { title: "Ad Library" };

export default async function AdLibraryPage({
  searchParams,
}: {
  searchParams: { platform?: string; style?: string; favoritesOnly?: string };
}) {
  const user = await requireUser();
  const creatives = await getUserAdCreatives(user.id);

  const filtered = creatives.filter((c) => {
    if (searchParams.platform && c.campaign.platform !== searchParams.platform) return false;
    if (searchParams.style && c.style !== searchParams.style) return false;
    if (searchParams.favoritesOnly === "true" && !c.favorite) return false;
    return true;
  });

  const platforms = Array.from(new Set(creatives.map((c) => c.campaign.platform)));
  const styles = Array.from(new Set(creatives.map((c) => c.style)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ad Library</h1>
        <p className="text-sm text-muted-foreground">All ad creatives you&apos;ve generated, across every campaign.</p>
      </div>

      <LibraryFilters platforms={platforms} styles={styles} />

      {filtered.length === 0 ? (
        <EmptyState icon={Library} title="No ads found" description="Generate ads from a campaign to see them here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.flatMap((creative) =>
            creative.variants.map((variant) => (
              <Card key={variant.id}>
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <Badge variant="outline">{creative.style}</Badge>
                  {creative.favorite && <Badge>Favorite</Badge>}
                </CardHeader>
                <CardContent className="space-y-2">
                  <AdPreview variant={variant} platform={creative.campaign.platform} brandName={creative.campaign.product?.title ?? "Brand"} />
                  <p className="text-xs text-muted-foreground">{creative.campaign.product?.title}</p>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={`/ads/${creative.campaignId}`}>Open campaign</Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
