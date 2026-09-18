import { Package } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, relativeTime } from "@/lib/utils";

export const metadata = { title: "Orders" };

const statusVariant: Record<string, "outline" | "secondary" | "success" | "destructive" | "warning"> = {
  PENDING: "warning",
  PAID: "success",
  CANCELED: "destructive",
  REFUNDED: "secondary",
};

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await prisma.storeOrder.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { store: { select: { name: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground">Real purchases made through your published stores&apos; checkout.</p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="Orders placed through your stores' checkout will show up here once a customer pays."
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{order.productTitle}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.store.name} · Qty {order.quantity} · {order.customerEmail}
                  </p>
                  <p className="text-xs text-muted-foreground">{relativeTime(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{formatCurrency(order.totalAmount, order.currency)}</span>
                  <Badge variant={statusVariant[order.status] ?? "outline"}>{order.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
