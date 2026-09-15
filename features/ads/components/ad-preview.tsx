import Image from "next/image";
import { Heart, MessageCircle, Send, ThumbsUp, Search as SearchIcon } from "lucide-react";
import type { AdVariant } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

export function AdPreview({ variant, platform, brandName }: { variant: AdVariant; platform: string; brandName: string }) {
  const imageBlock = variant.imageUrl ? (
    <div className="relative aspect-square w-full overflow-hidden bg-muted">
      <Image src={variant.imageUrl} alt={variant.headline ?? "Ad creative"} fill className="object-cover" unoptimized />
    </div>
  ) : (
    <div className="flex aspect-square w-full items-center justify-center bg-muted text-xs text-muted-foreground">No image generated yet</div>
  );

  if (platform === "GOOGLE") {
    return (
      <div className="rounded-lg border p-3">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <SearchIcon className="h-3 w-3" /> Ad · example.com
        </div>
        <p className="text-primary underline">{variant.headline}</p>
        <p className="text-sm text-muted-foreground">{variant.description}</p>
      </div>
    );
  }

  if (platform === "PINTEREST") {
    return (
      <div className="overflow-hidden rounded-2xl border">
        {imageBlock}
        <div className="p-2">
          <p className="line-clamp-2 text-sm font-medium">{variant.headline}</p>
        </div>
      </div>
    );
  }

  if (platform === "TIKTOK") {
    return (
      <div className="relative aspect-[9/16] w-full max-w-[220px] overflow-hidden rounded-xl border bg-black text-white">
        {variant.imageUrl && <Image src={variant.imageUrl} alt="" fill className="object-cover opacity-70" unoptimized />}
        <div className="absolute bottom-0 left-0 right-0 space-y-1 bg-gradient-to-t from-black/80 to-transparent p-3">
          <p className="text-sm font-medium">@{brandName.toLowerCase().replace(/\s+/g, "")}</p>
          <p className="line-clamp-2 text-xs">{variant.primaryText}</p>
          <Badge className="bg-white text-black hover:bg-white">{variant.cta}</Badge>
        </div>
      </div>
    );
  }

  // Meta / Facebook / Instagram default card
  return (
    <div className="max-w-sm overflow-hidden rounded-lg border">
      <div className="flex items-center gap-2 p-3">
        <div className="h-8 w-8 rounded-full bg-muted" />
        <div>
          <p className="text-sm font-medium">{brandName}</p>
          <p className="text-xs text-muted-foreground">Sponsored</p>
        </div>
      </div>
      <p className="px-3 pb-2 text-sm">{variant.primaryText}</p>
      {imageBlock}
      <div className="flex items-center justify-between p-3">
        <div>
          <p className="text-sm font-semibold">{variant.headline}</p>
          <p className="text-xs text-muted-foreground">{variant.description}</p>
        </div>
        <Badge>{variant.cta}</Badge>
      </div>
      <div className="flex items-center justify-around border-t p-2 text-muted-foreground">
        <ThumbsUp className="h-4 w-4" />
        <MessageCircle className="h-4 w-4" />
        <Send className="h-4 w-4" />
        <Heart className="h-4 w-4" />
      </div>
    </div>
  );
}
