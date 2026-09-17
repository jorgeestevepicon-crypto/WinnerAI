import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { integrations } from "@/config/env";
import { StoreBuilderWizard } from "@/features/stores/components/store-builder-wizard";

export const metadata = { title: "AI Store Builder" };

export default async function StoreBuilderPage({ searchParams }: { searchParams: { productId?: string } }) {
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
        <h1 className="text-2xl font-semibold tracking-tight">AI Store Builder</h1>
        <p className="text-sm text-muted-foreground">Generate a brand and homepage for one of your saved products.</p>
      </div>
      <StoreBuilderWizard products={products} defaultProductId={searchParams.productId} aiConfigured={integrations.aiConfigured} />
    </div>
  );
}
