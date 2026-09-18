"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X, Rocket } from "lucide-react";
import { toast } from "sonner";
import type { ShopifyConnection } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PublishChecklistItem } from "@/features/stores/server/publish";
import { publishStoreToShopify } from "@/features/stores/server/publish";
import { cn } from "@/lib/utils";

const STAGES = ["Preparing", "Uploading", "Configuring", "Publishing", "Completed"] as const;

export function PublishFlow({
  storeId,
  checklist,
  readyToPublish,
  connections,
  alreadyPublished,
}: {
  storeId: string;
  checklist: PublishChecklistItem[];
  readyToPublish: boolean;
  connections: ShopifyConnection[];
  alreadyPublished: boolean;
}) {
  const router = useRouter();
  const [connectionId, setConnectionId] = useState(connections[0]?.id);
  const [stageIndex, setStageIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePublish() {
    if (!connectionId) return;
    setError(null);
    setStageIndex(0);

    const progressTimer = setInterval(() => {
      setStageIndex((i) => (i !== null && i < STAGES.length - 2 ? i + 1 : i));
    }, 700);

    const result = await publishStoreToShopify(storeId, connectionId);
    clearInterval(progressTimer);

    if (!result.success) {
      setError(result.error);
      setStageIndex(null);
      toast.error(result.error);
      return;
    }

    setStageIndex(STAGES.length - 1);
    toast.success("Published to Shopify");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pre-publish checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {checklist.map((item) => (
            <div key={item.key} className="flex items-center gap-2 text-sm">
              {item.complete ? <Check className="h-4 w-4 text-success" /> : <X className="h-4 w-4 text-muted-foreground" />}
              <span className={cn(!item.complete && "text-muted-foreground")}>{item.label}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {connections.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No connected Shopify store.{" "}
            <a href="/shopify" className="underline">
              Connect one first
            </a>
            .
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Publish</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={connectionId} onValueChange={setConnectionId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a Shopify store" />
              </SelectTrigger>
              <SelectContent>
                {connections.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.shopDomain}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {stageIndex !== null && (
              <div className="space-y-2">
                {STAGES.map((stage, i) => (
                  <div key={stage} className="flex items-center gap-2 text-sm">
                    {i < stageIndex || (i === stageIndex && i === STAGES.length - 1) ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : i === stageIndex ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border" />
                    )}
                    <span className={cn(i > stageIndex && "text-muted-foreground")}>{stage}</span>
                  </div>
                ))}
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              onClick={handlePublish}
              disabled={!connectionId || !readyToPublish || (stageIndex !== null && stageIndex < STAGES.length - 1)}
            >
              {stageIndex !== null && stageIndex < STAGES.length - 1 ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Rocket className="h-4 w-4" />
              )}
              {alreadyPublished ? "Republish to Shopify" : "Publish to Shopify"}
            </Button>
            {!readyToPublish && <p className="text-xs text-muted-foreground">Complete the required checklist items above before publishing.</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
