import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { NewCampaignForm } from "@/features/ads/components/new-campaign-form";

export const metadata = { title: "New Campaign" };

export default async function NewCampaignPage({ searchParams }: { searchParams: { productId?: string } }) {
  const user = await requireUser();
  const products = await prisma.product.findMany({
    where: {
      userId: user.id,
      deletedAt: null,
      OR: [{ saved: true }, { id: searchParams.productId }],
    },
    orderBy: { winningScore: "desc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New ad campaign</h1>
        <p className="text-sm text-muted-foreground">Choose a product, platform, objective and audience.</p>
      </div>
      <NewCampaignForm products={products} defaultProductId={searchParams.productId} />
    </div>
  );
}
