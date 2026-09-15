"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@prisma/client";
import { LayoutGrid, List, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { WinningScoreBadge } from "@/components/shared/winning-score-badge";
import { SaveButton } from "@/features/products/components/save-button";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function ProductResults({ products }: { products: Product[] }) {
  const [view, setView] = useState<"grid" | "table">("grid");

  if (products.length === 0) {
    return (
      <EmptyState
        icon={Search}
        title="No products found"
        description="Try adjusting your filters, or click 'Find products' to discover new opportunities."
        className="mt-4"
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-1">
        <Button variant={view === "grid" ? "secondary" : "ghost"} size="icon" onClick={() => setView("grid")}>
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button variant={view === "table" ? "secondary" : "ghost"} size="icon" onClick={() => setView("table")}>
          <List className="h-4 w-4" />
        </Button>
      </div>

      {view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Link key={product.id} href={`/products/${product.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <div className="flex h-32 items-center justify-center rounded-t-xl bg-muted text-xs text-muted-foreground">
                  {product.category ?? "Product"}
                </div>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-sm font-medium">{product.title}</p>
                    <SaveButton productId={product.id} saved={product.saved} size="icon" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{formatCurrency(product.price, product.currency)}</span>
                    <span className="text-xs text-muted-foreground">{formatPercent(product.estimatedMargin)} margin</span>
                  </div>
                  <WinningScoreBadge score={product.winningScore} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Margin</TableHead>
                <TableHead>Winning Score</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id} className={cn(product.saved && "bg-accent/30")}>
                  <TableCell>
                    <Link href={`/products/${product.id}`} className="font-medium hover:underline">
                      {product.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{product.category}</TableCell>
                  <TableCell>{formatCurrency(product.price, product.currency)}</TableCell>
                  <TableCell>{formatPercent(product.estimatedMargin)}</TableCell>
                  <TableCell>
                    <WinningScoreBadge score={product.winningScore} />
                  </TableCell>
                  <TableCell className="text-right">
                    <SaveButton productId={product.id} saved={product.saved} size="sm" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
