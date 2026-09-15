import { Check, XCircle } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { integrations } from "@/config/env";
import { PLANS } from "@/features/billing/plans";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckoutButton } from "@/features/billing/components/checkout-button";
import { PortalButton } from "@/features/billing/components/portal-button";
import { cn } from "@/lib/utils";

export const metadata = { title: "Billing" };

export default async function BillingPage({ searchParams }: { searchParams: { checkout?: string } }) {
  const user = await requireUser();
  const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
  const currentPlan = subscription?.plan ?? "FREE";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">Manage your WinnerAI subscription. No credit systems — limits are based on your plan.</p>
      </div>

      {searchParams.checkout === "success" && (
        <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success">
          <Check className="h-4 w-4" /> Subscription updated.
        </div>
      )}

      {!integrations.stripeConfigured && (
        <div className="flex items-center gap-2 rounded-md border p-3 text-sm text-muted-foreground">
          <XCircle className="h-4 w-4" /> Billing isn&apos;t configured in this environment. Set <code>STRIPE_SECRET_KEY</code> and the plan
          price IDs to enable checkout.
        </div>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Current plan</CardTitle>
            <CardDescription>
              {currentPlan} · {subscription?.status ?? "ACTIVE"}
              {subscription?.currentPeriodEnd && ` · renews ${subscription.currentPeriodEnd.toLocaleDateString()}`}
            </CardDescription>
          </div>
          {integrations.stripeConfigured && subscription?.stripeCustomerId && <PortalButton />}
        </CardHeader>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <Card key={plan.id} className={cn(plan.id === currentPlan && "border-primary shadow-md")}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.name}</CardTitle>
                {plan.id === currentPlan && <Badge>Current</Badge>}
              </div>
              <div className="text-3xl font-semibold">
                ${plan.price}
                <span className="text-sm font-normal text-muted-foreground">/mo</span>
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan.features.map((f) => (
                <div key={f} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {f}
                </div>
              ))}
              {plan.id !== currentPlan && plan.id !== "FREE" && (
                <CheckoutButton plan={plan.id} label={PLANS.findIndex((p) => p.id === plan.id) > PLANS.findIndex((p) => p.id === currentPlan) ? "Upgrade" : "Downgrade"} />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
