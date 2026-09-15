import { requireUser } from "@/lib/auth/session";
import {
  getDashboardStats,
  getTopProductOpportunities,
  getRecentStores,
  getAdPerformanceSummary,
  getRecentActivity,
} from "@/lib/dashboard/queries";
import { StatCards } from "@/components/dashboard/stat-cards";
import { ProductOpportunities } from "@/components/dashboard/product-opportunities";
import { StoreActivity } from "@/components/dashboard/store-activity";
import { AdPerformance } from "@/components/dashboard/ad-performance";
import { AIRecommendations } from "@/components/dashboard/ai-recommendations";
import { RecentActivity } from "@/components/dashboard/recent-activity";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();

  const [stats, products, stores, ads, activity] = await Promise.all([
    getDashboardStats(user.id),
    getTopProductOpportunities(user.id),
    getRecentStores(user.id),
    getAdPerformanceSummary(user.id),
    getRecentActivity(user.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}</h1>
        <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening across your workspace.</p>
      </div>

      <StatCards stats={stats} />

      <div className="grid gap-4 lg:grid-cols-2">
        <ProductOpportunities products={products} />
        <StoreActivity stores={stores} />
        <AdPerformance summary={ads} />
        <AIRecommendations />
      </div>

      <RecentActivity activity={activity} />
    </div>
  );
}
