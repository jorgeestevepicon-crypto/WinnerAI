import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getCampaignById } from "@/features/ads/server/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Megaphone } from "lucide-react";
import { GenerateCreativeForm } from "@/features/ads/components/generate-creative-form";
import { CreativeCard } from "@/features/ads/components/creative-card";
import { VideoConceptPanel } from "@/features/ads/components/video-concept-panel";

export const metadata = { title: "Campaign" };

export default async function CampaignPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const campaign = await getCampaignById(params.id, user.id);
  if (!campaign) notFound();

  const brandName = campaign.product?.title ?? "Your Brand";

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/ads">
          <ArrowLeft className="h-4 w-4" /> Back to campaigns
        </Link>
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{campaign.name}</h1>
          <p className="text-sm text-muted-foreground">
            {campaign.product?.title} · {campaign.platform} · {campaign.objective}
          </p>
        </div>
        <Badge variant="outline">{campaign.status}</Badge>
      </div>

      <GenerateCreativeForm campaignId={campaign.id} />

      {campaign.creatives.length === 0 ? (
        <EmptyState icon={Megaphone} title="No creatives yet" description="Generate ad copy above to see previews here." />
      ) : (
        <div className="space-y-4">
          {campaign.creatives.map((creative) => (
            <CreativeCard key={creative.id} creative={creative} platform={campaign.platform} brandName={brandName} />
          ))}
        </div>
      )}

      <VideoConceptPanel campaignId={campaign.id} />
    </div>
  );
}
