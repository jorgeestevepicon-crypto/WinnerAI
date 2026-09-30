"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { COMMON_PRODUCT_CATEGORIES } from "@/features/products/categories";
import { runProductDiscovery } from "@/features/products/server/actions";
import { getAliExpressAuthUrl } from "@/features/aliexpress/server/actions";
import type { DiscoverableSource } from "@/features/products/components/discover-button";

const LAST_SOURCE_STORAGE_KEY = "productFinder.lastSource";

const sortOptions = [
  { value: "winningScore", label: "Winning Score" },
  { value: "price", label: "Price (low to high)" },
  { value: "margin", label: "Margin" },
  { value: "trend", label: "Trend" },
  { value: "createdAt", label: "Newest" },
];

export function ProductFilters({
  categories,
  countries,
  sources,
  aliexpressConnected,
  aliexpressCategories = [],
}: {
  categories: string[];
  countries: string[];
  sources: DiscoverableSource[];
  aliexpressConnected: boolean;
  /** AliExpress's own real category tree (names only), when connected — replaces the curated fallback list for this source. */
  aliexpressCategories?: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("query") ?? "");
  // Starts at "demo" to match the server-rendered markup, then picks up the
  // remembered source client-side once mounted (avoids an SSR/hydration
  // mismatch from reading localStorage during the initial render).
  const [source, setSource] = useState("demo");
  useEffect(() => {
    const stored = window.localStorage.getItem(LAST_SOURCE_STORAGE_KEY);
    if (stored) setSource(stored);
  }, []);
  const [searching, setSearching] = useState(false);
  const [advanced, setAdvanced] = useState({
    minPrice: searchParams.get("minPrice") ?? "",
    maxPrice: searchParams.get("maxPrice") ?? "",
    minMargin: searchParams.get("minMargin") ?? "",
    minTrend: searchParams.get("minTrend") ?? "",
    maxCompetition: searchParams.get("maxCompetition") ?? "",
    maxSaturation: searchParams.get("maxSaturation") ?? "",
  });

  function applyParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSourceChange(value: string) {
    setSource(value);
    if (typeof window !== "undefined") window.localStorage.setItem(LAST_SOURCE_STORAGE_KEY, value);
  }

  const selectedSource = sources.find((s) => s.id === source);
  const baseCategories = source === "aliexpress" && aliexpressCategories.length > 0 ? aliexpressCategories : COMMON_PRODUCT_CATEGORIES;
  const allCategories = Array.from(new Set([...baseCategories, ...categories])).sort();

  async function handleCategoryChange(value: string) {
    const category = value === "all" ? undefined : value;

    // For a real (non-demo) source, changing the category runs a fresh
    // search against that source instead of just filtering what's already
    // saved — so picking a category you haven't searched before actually
    // fetches products for it, not an empty list.
    if (source !== "demo" && category) {
      if (source === "aliexpress" && !aliexpressConnected) {
        const authResult = await getAliExpressAuthUrl();
        if (!authResult.success) {
          toast.error(authResult.error);
          return;
        }
        window.location.href = authResult.url;
        return;
      }
      setSearching(true);
      const result = await runProductDiscovery({ sourceId: source, category });
      setSearching(false);

      if (!result.success) {
        toast.error(result.error);
        return;
      }
      if (result.count > 0) toast.success(`Found ${result.count} products in "${category}"`);
    }

    applyParams({ category });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <form
        className="relative flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          applyParams({ query });
        }}
      >
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          className="pl-8"
        />
      </form>

      <div className="w-full sm:w-40">
        <Select value={source} onValueChange={handleSourceChange}>
          <SelectTrigger>
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            {sources.map((s) => (
              <SelectItem key={s.id} value={s.id} disabled={!s.configured}>
                {s.label}
                {!s.configured ? " (not configured)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedSource?.id === "aliexpress" && !aliexpressConnected && (
          <p className="mt-1 text-xs text-muted-foreground">Picking a category will ask you to connect AliExpress.</p>
        )}
      </div>

      <Select value={searchParams.get("category") ?? "all"} onValueChange={handleCategoryChange} disabled={searching}>
        <SelectTrigger className="w-full sm:w-40">
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <SelectValue placeholder="Category" />}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {allCategories.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={searchParams.get("country") ?? "all"} onValueChange={(v) => applyParams({ country: v === "all" ? undefined : v })}>
        <SelectTrigger className="w-full sm:w-32">
          <SelectValue placeholder="Country" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All countries</SelectItem>
          {countries.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={searchParams.get("sortBy") ?? "winningScore"} onValueChange={(v) => applyParams({ sortBy: v })}>
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Min price</Label>
              <Input
                type="number"
                value={advanced.minPrice}
                onChange={(e) => setAdvanced((s) => ({ ...s, minPrice: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">Max price</Label>
              <Input
                type="number"
                value={advanced.maxPrice}
                onChange={(e) => setAdvanced((s) => ({ ...s, maxPrice: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">Min margin %</Label>
              <Input
                type="number"
                value={advanced.minMargin}
                onChange={(e) => setAdvanced((s) => ({ ...s, minMargin: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">Min trend</Label>
              <Input
                type="number"
                value={advanced.minTrend}
                onChange={(e) => setAdvanced((s) => ({ ...s, minTrend: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">Max competition</Label>
              <Input
                type="number"
                value={advanced.maxCompetition}
                onChange={(e) => setAdvanced((s) => ({ ...s, maxCompetition: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">Max saturation</Label>
              <Input
                type="number"
                value={advanced.maxSaturation}
                onChange={(e) => setAdvanced((s) => ({ ...s, maxSaturation: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="savedOnly"
              checked={searchParams.get("savedOnly") === "true"}
              onCheckedChange={(v) => applyParams({ savedOnly: v ? "true" : undefined })}
            />
            <Label htmlFor="savedOnly" className="font-normal">
              Saved only
            </Label>
          </div>
          <Button size="sm" className="w-full" onClick={() => applyParams(advanced)}>
            Apply filters
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
