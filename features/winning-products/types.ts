import type {
  CompetitionLevel,
  DiscoveryOrigin,
  Product,
  ProductAdTest,
  ProductManualSignal,
  ProductSnapshot,
  ProductSupplierChecklist,
  TrendDirection,
  WinningProductStatus,
  WinningScoreConfig,
} from "@prisma/client";

export type { WinningProductStatus, DiscoveryOrigin, CompetitionLevel, TrendDirection, WinningScoreConfig };

export type ProductWithWinningData = Product & {
  snapshots: ProductSnapshot[];
  manualSignal: ProductManualSignal | null;
  adTests: ProductAdTest[];
  supplierChecklist: ProductSupplierChecklist | null;
};

export interface AdTestMetrics {
  ctr: number | null;
  cpc: number | null;
  costPerAddToCart: number | null;
  cpa: number | null;
  roas: number | null;
  netProfit: number | null;
}

export interface DropshippingScoreBreakdown {
  margin?: number;
  priceRangeFit?: number;
  demand?: number;
  demandGrowth?: number;
  providerQuality?: number;
  logistics?: number;
  wowEffect?: number;
  physicalStores?: number;
  competitionLevel?: number;
  googleTrends?: number;
}

export interface DropshippingScoreResult {
  score: number;
  breakdown: DropshippingScoreBreakdown;
  /** Factor keys not currently included in the score (translate via the "winningProducts.scoreFactors" namespace), so the UI can explain why. */
  missingFactors: (keyof DropshippingScoreBreakdown)[];
  partial: boolean;
}
