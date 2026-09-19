"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Copy, Trash2, ImageIcon, Loader2, Video, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { AdCreative, AdVariant } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AdPreview } from "@/features/ads/components/ad-preview";
import {
  generateVariantImage,
  generateVariantVideo,
  checkVariantVideoStatus,
  toggleFavoriteCreative,
  duplicateCreative,
  deleteCreative,
} from "@/features/ads/server/actions";

const POLL_INTERVAL_MS = 5000;

function VideoControl({ variant, disabled }: { variant: AdVariant; disabled: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState(variant.videoStatus);
  const [videoUrl, setVideoUrl] = useState(variant.videoUrl);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (status !== "PROCESSING") return;
    const interval = setInterval(async () => {
      const result = await checkVariantVideoStatus(variant.id);
      if (!result.success) return;
      setStatus(result.status);
      if (result.status === "COMPLETED") {
        setVideoUrl(result.videoUrl ?? null);
        router.refresh();
      }
      if (result.status === "FAILED") {
        toast.error(result.error ?? "Video generation failed");
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [status, variant.id, router]);

  async function handleGenerate() {
    setStarting(true);
    const result = await generateVariantVideo(variant.id);
    setStarting(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setStatus("PROCESSING");
    setVideoUrl(null);
  }

  if (disabled) {
    return <p className="text-xs text-muted-foreground">Video generation isn&apos;t configured yet.</p>;
  }

  if (status === "PROCESSING") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating video… (can take a few minutes)
      </div>
    );
  }

  if (videoUrl) {
    return (
      <div className="space-y-1.5">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video src={videoUrl} controls className="w-full rounded-md" />
        <Button variant="outline" size="sm" onClick={handleGenerate} disabled={starting}>
          {starting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Regenerate video
        </Button>
      </div>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={handleGenerate} disabled={starting}>
      {starting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Video className="h-3.5 w-3.5" />}
      Generate video
    </Button>
  );
}

export function CreativeCard({
  creative,
  platform,
  brandName,
  videoConfigured,
}: {
  creative: AdCreative & { variants: AdVariant[] };
  platform: string;
  brandName: string;
  videoConfigured: boolean;
}) {
  const router = useRouter();
  const [favorite, setFavorite] = useState(creative.favorite);
  const [busy, setBusy] = useState(false);
  const [imagingId, setImagingId] = useState<string | null>(null);

  async function handleFavorite() {
    setFavorite((f) => !f);
    const result = await toggleFavoriteCreative(creative.id);
    if (!result.success) setFavorite((f) => !f);
  }

  async function handleDuplicate() {
    setBusy(true);
    const result = await duplicateCreative(creative.id);
    setBusy(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Duplicated");
    router.refresh();
  }

  async function handleDelete() {
    setBusy(true);
    const result = await deleteCreative(creative.id);
    setBusy(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  async function handleGenerateImage(variantId: string) {
    setImagingId(variantId);
    const result = await generateVariantImage(variantId);
    setImagingId(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{creative.style}</Badge>
          <span className="text-sm text-muted-foreground">{creative.format}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleFavorite}>
            <Heart className={cn("h-4 w-4", favorite && "fill-destructive text-destructive")} />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDuplicate} disabled={busy}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDelete} disabled={busy}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {creative.variants.map((variant) => (
            <div key={variant.id} className="space-y-2">
              <AdPreview variant={variant} platform={platform} brandName={brandName} />
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">{variant.label} · {variant.angle}</p>
                <Button variant="outline" size="sm" onClick={() => handleGenerateImage(variant.id)} disabled={imagingId !== null}>
                  {imagingId === variant.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
                  {variant.imageUrl ? "Regenerate image" : "Generate image"}
                </Button>
              </div>
              <VideoControl variant={variant} disabled={!videoConfigured} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
