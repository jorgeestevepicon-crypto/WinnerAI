"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
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

const sortOptions = [
  { value: "winningScore", label: "Winning Score" },
  { value: "price", label: "Price (low to high)" },
  { value: "margin", label: "Margin" },
  { value: "trend", label: "Trend" },
  { value: "createdAt", label: "Newest" },
];

export function ProductFilters({ categories, countries }: { categories: string[]; countries: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("query") ?? "");
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

      <Select value={searchParams.get("category") ?? "all"} onValueChange={(v) => applyParams({ category: v === "all" ? undefined : v })}>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories.map((c) => (
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
