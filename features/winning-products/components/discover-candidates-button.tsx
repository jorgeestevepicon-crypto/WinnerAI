"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { discoverWinningCandidates } from "@/features/winning-products/server/actions";
import { getAliExpressAuthUrl } from "@/features/aliexpress/server/actions";
import { COMMON_PRODUCT_CATEGORIES } from "@/features/products/categories";

export function DiscoverCandidatesButton({ aliexpressConnected }: { aliexpressConnected: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");

  async function handleConnect() {
    setConnecting(true);
    const result = await getAliExpressAuthUrl();
    setConnecting(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    window.location.href = result.url;
  }

  async function handleSubmit() {
    setLoading(true);
    const result = await discoverWinningCandidates({ query: query.trim() || undefined, category: category.trim() || undefined });
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    if (result.count === 0) {
      toast.info("No new candidates matched this search.");
      return;
    }
    toast.success(`Found ${result.count} new candidates`);
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Sparkles className="h-4 w-4" />
          Find candidates
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Find winning-product candidates</DialogTitle>
        </DialogHeader>
        {!aliexpressConnected ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Connect your AliExpress account to search for candidates.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Category (optional)</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Any category" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_PRODUCT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Search keywords (optional)</Label>
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. wireless earbuds" />
            </div>
          </div>
        )}
        <DialogFooter>
          {!aliexpressConnected ? (
            <Button onClick={handleConnect} disabled={connecting}>
              {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              Connect AliExpress
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading || (!query.trim() && !category.trim())}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Search
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
