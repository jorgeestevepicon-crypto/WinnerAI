"use client";

import { useState } from "react";
import { Clapperboard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateCampaignVideoConcept } from "@/features/ads/server/actions";
import type { VideoConceptOutput } from "@/lib/ai/services/video-concept";

const STAGE_LABELS: Record<string, string> = {
  hook: "Hook",
  problem: "Problem",
  product_intro: "Product Intro",
  solution: "Solution",
  benefits: "Benefits",
  cta: "CTA",
};

export function VideoConceptPanel({ campaignId }: { campaignId: string }) {
  const [loading, setLoading] = useState(false);
  const [concept, setConcept] = useState<VideoConceptOutput | null>(null);

  async function handleGenerate() {
    setLoading(true);
    const result = await generateCampaignVideoConcept(campaignId);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setConcept(result.concept);
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clapperboard className="h-4 w-4" /> Video Concept
        </CardTitle>
        <Button size="sm" variant="outline" onClick={handleGenerate} disabled={loading}>
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {concept ? "Regenerate" : "Generate concept"}
        </Button>
      </CardHeader>
      {concept && (
        <CardContent className="space-y-3">
          <div>
            <p className="font-medium">{concept.title}</p>
            <p className="text-sm text-muted-foreground">{concept.concept}</p>
            <p className="text-xs text-muted-foreground">Total duration: {concept.totalDurationSeconds}s</p>
          </div>
          <div className="space-y-2">
            {concept.scenes.map((scene, i) => (
              <div key={i} className="rounded-md border p-3 text-sm">
                <div className="mb-1 flex items-center justify-between">
                  <Badge variant="outline">{STAGE_LABELS[scene.stage] ?? scene.stage}</Badge>
                  <span className="text-xs text-muted-foreground">{scene.durationSeconds}s</span>
                </div>
                <p className="text-xs text-muted-foreground">On-screen: {scene.onScreenText}</p>
                <p className="text-xs text-muted-foreground">Voiceover: {scene.voiceover}</p>
                <p className="text-xs text-muted-foreground">Visual: {scene.visualDirection}</p>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
