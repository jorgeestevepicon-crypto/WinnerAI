import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getStripeClient } from "@/lib/stripe/client";
import { getPublicStore } from "@/features/storefront/server/queries";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StoreCheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { session_id?: string };
}) {
  const store = await getPublicStore(params.id);
  if (!store) notFound();

  const stripe = getStripeClient();
  const session = stripe && searchParams.session_id ? await stripe.checkout.sessions.retrieve(searchParams.session_id).catch(() => null) : null;

  const brand = (store.brand as { name?: string } | null)?.name || store.name;
  const paid = session?.payment_status === "paid";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <CheckCircle2 className="h-12 w-12 text-success" />
      <h1 className="text-2xl font-semibold">{paid ? "Thank you for your order!" : "Order received"}</h1>
      <p className="max-w-md text-muted-foreground">
        {paid
          ? `Your payment to ${brand} was successful. You'll receive a confirmation at ${session?.customer_details?.email ?? "your email"}.`
          : "We couldn't confirm the payment status right now — check your email for a receipt from Stripe."}
      </p>
      {session?.amount_total !== undefined && session?.amount_total !== null && (
        <p className="text-sm text-muted-foreground">
          Total charged: {formatCurrency((session.amount_total ?? 0) / 100, session.currency?.toUpperCase())}
        </p>
      )}
      <a href={`/s/${store.id}`} className="text-sm underline">
        Back to {brand}
      </a>
    </div>
  );
}
