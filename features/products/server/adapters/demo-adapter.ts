import type { NormalizedProductInput, ProductSearchParams, ProductSourceAdapter } from "@/features/products/types";

// Deterministic pseudo-random generator so the demo catalog is stable across
// runs (no external API, no network access) but still varied per product.
function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

const CATALOG: Array<{
  title: string;
  category: string;
  description: string;
  cost: number;
  price: number;
  country: string;
  seed: number;
}> = [
  { title: "Portable Neck Fan", category: "Electronics", description: "Hands-free wearable fan for hot commutes and workouts.", cost: 6.5, price: 24.99, country: "US", seed: 11 },
  { title: "LED Facial Massage Roller", category: "Beauty", description: "At-home skincare tool combining microcurrent and LED therapy.", cost: 8.2, price: 39.99, country: "US", seed: 23 },
  { title: "Collapsible Dog Travel Bowl", category: "Pet Supplies", description: "Silicone foldable bowl for on-the-go pet hydration.", cost: 2.1, price: 14.99, country: "CA", seed: 7 },
  { title: "Magnetic Car Phone Mount", category: "Electronics", description: "Dashboard mount with strong magnetic hold for any smartphone.", cost: 3.4, price: 19.99, country: "US", seed: 31 },
  { title: "Posture Corrector Brace", category: "Health", description: "Adjustable back brace for improving posture during desk work.", cost: 4.8, price: 27.99, country: "UK", seed: 5 },
  { title: "Mini Projector Keychain Light", category: "Electronics", description: "Compact LED keychain that projects a starry sky pattern.", cost: 1.9, price: 12.99, country: "US", seed: 44 },
  { title: "Reusable Silicone Food Bags", category: "Kitchen", description: "Set of eco-friendly, dishwasher-safe silicone storage bags.", cost: 3.2, price: 21.99, country: "CA", seed: 17 },
  { title: "Scalp Massager Shampoo Brush", category: "Beauty", description: "Silicone scalp brush for shower use, promotes circulation.", cost: 1.1, price: 9.99, country: "US", seed: 52 },
  { title: "Foldable Laptop Stand", category: "Office", description: "Aluminum adjustable stand for ergonomic laptop use.", cost: 5.6, price: 32.99, country: "DE", seed: 9 },
  { title: "Smart Water Bottle Tracker", category: "Health", description: "Bottle sleeve that tracks hydration and syncs to an app.", cost: 7.9, price: 34.99, country: "US", seed: 61 },
  { title: "Compression Ankle Sleeves", category: "Sports", description: "Breathable compression sleeves for running and recovery.", cost: 2.5, price: 17.99, country: "US", seed: 3 },
  { title: "Retractable Garden Hose Reel", category: "Home & Garden", description: "Wall-mounted reel with auto-retract for easy garden watering.", cost: 12.4, price: 49.99, country: "UK", seed: 27 },
  { title: "Bluetooth Sleep Eye Mask", category: "Electronics", description: "Ultra-thin eye mask with built-in speakers for sleep audio.", cost: 6.1, price: 26.99, country: "US", seed: 38 },
  { title: "Stainless Steel Garlic Press", category: "Kitchen", description: "Heavy-duty press with self-cleaning mechanism.", cost: 2.0, price: 13.99, country: "CA", seed: 14 },
  { title: "Adjustable Resistance Bands Set", category: "Sports", description: "5-level resistance band set with door anchor for home workouts.", cost: 3.7, price: 22.99, country: "US", seed: 48 },
  { title: "Mini Handheld Vacuum", category: "Home & Garden", description: "Cordless vacuum for car interiors and tight spaces.", cost: 9.3, price: 36.99, country: "US", seed: 21 },
  { title: "Ceramic Hair Straightening Brush", category: "Beauty", description: "2-in-1 detangling and straightening heated brush.", cost: 5.4, price: 29.99, country: "UK", seed: 55 },
  { title: "Non-Slip Yoga Knee Pad Cushion", category: "Sports", description: "Extra-thick pad for knees and elbows during floor exercises.", cost: 2.8, price: 16.99, country: "US", seed: 33 },
];

function buildSignals(seed: number): {
  demand: number;
  trend: number;
  competition: number;
  saturation: number;
  engagement: number;
  growth: number;
} {
  const rand = seededRandom(seed);
  const range = (min: number, max: number) => Math.round(min + rand() * (max - min));
  return {
    demand: range(40, 95),
    trend: range(35, 98),
    competition: range(15, 85),
    saturation: range(10, 80),
    engagement: range(30, 95),
    growth: range(20, 90),
  };
}

export const demoProductSourceAdapter: ProductSourceAdapter = {
  id: "demo",
  label: "Demo catalog",
  configured: true,
  async search(params: ProductSearchParams): Promise<NormalizedProductInput[]> {
    const limit = params.limit ?? CATALOG.length;

    return CATALOG.filter((item) => {
      if (params.category && item.category !== params.category) return false;
      if (params.query && !item.title.toLowerCase().includes(params.query.toLowerCase())) return false;
      return true;
    })
      .slice(0, limit)
      .map((item) => ({
        title: item.title,
        description: item.description,
        images: [],
        category: item.category,
        sourceUrl: undefined,
        supplierName: "WinnerAI Demo Supplier",
        supplierUrl: undefined,
        cost: item.cost,
        price: item.price,
        currency: "USD",
        shippingCost: 0,
        country: item.country,
        signals: buildSignals(item.seed),
        metadata: { demo: true },
      }));
  },
};
