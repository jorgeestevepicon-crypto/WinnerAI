import { Users, Store, Megaphone, Package, AlertTriangle } from "lucide-react";
import { getAdminOverview } from "@/features/admin/server/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { relativeTime } from "@/lib/utils";

export const metadata = { title: "Admin Overview" };

export default async function AdminOverviewPage() {
  const overview = await getAdminOverview();

  const stats = [
    { label: "Users", value: overview.userCount, icon: Users },
    { label: "New users (30d)", value: overview.activeUserCount, icon: Users },
    { label: "Products", value: overview.productCount, icon: Package },
    { label: "Stores", value: overview.storeCount, icon: Store },
    { label: "Ad campaigns", value: overview.campaignCount, icon: Megaphone },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <stat.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xl font-semibold leading-none">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subscriptions by plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overview.subscriptionsByPlan.map((s) => (
              <div key={s.plan} className="flex items-center justify-between text-sm">
                <span>{s.plan}</span>
                <Badge variant="outline">{s._count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI jobs by status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overview.jobCounts.map((j) => (
              <div key={j.status} className="flex items-center justify-between text-sm">
                <span>{j.status}</span>
                <Badge variant={j.status === "FAILED" ? "destructive" : "outline"}>{j._count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-destructive" /> Recent errors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {overview.recentErrors.length === 0 ? (
            <p className="text-sm text-muted-foreground">No failed jobs recently.</p>
          ) : (
            overview.recentErrors.map((job) => (
              <div key={job.id} className="rounded-md border p-2 text-sm">
                <p className="font-medium">{job.type}</p>
                <p className="text-xs text-muted-foreground">{job.error}</p>
                <p className="text-xs text-muted-foreground">{relativeTime(job.updatedAt)}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
