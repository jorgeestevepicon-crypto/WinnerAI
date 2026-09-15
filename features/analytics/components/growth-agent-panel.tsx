"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { runGrowthAgent } from "@/features/analytics/server/growth-agent";
import type { GrowthRecommendation } from "@/lib/ai/services/growth-recommendations";

export function GrowthAgentPanel() {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<GrowthRecommendation[] | null>(null);

  async function handleGenerate() {
    setLoading(true);
    const result = await runGrowthAgent();
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setRecommendations(result.recommendations);
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> AI Growth Agent
        </CardTitle>
        <Button size="sm" variant="outline" onClick={handleGenerate} disabled={loading}>
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {recommendations ? "Refresh" : "Get recommendations"}
        </Button>
      </CardHeader>
      <CardContent>
        {!recommendations ? (
          <p className="text-sm text-muted-foreground">
            The Growth Agent analyzes your products, stores and campaigns to suggest next steps. It never takes action on its own —
            you decide what to apply.
          </p>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div key={i} className="rounded-lg border p-3">
                <div className="mb-1 flex items-center gap-2">
                  <Badge variant="outline">{rec.type}</Badge>
                  {rec.requiresConfirmation && (
                    <Badge variant="warning" className="gap-1">
                      <ShieldCheck className="h-3 w-3" /> Needs your review
                    </Badge>
                  )}
                </div>
                <p className="font-medium">{rec.title}</p>
                <p className="text-sm text-muted-foreground">{rec.rationale}</p>
                <p className="mt-1 text-sm">{rec.suggestedAction}</p>
                {rec.actionHref && (
                  <Button variant="link" size="sm" className="h-auto p-0" asChild>
                    <Link href={rec.actionHref}>
                      Go there <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
