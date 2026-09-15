import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getPublishChecklist } from "@/features/stores/server/publish";
import { PublishFlow } from "@/features/stores/components/publish-flow";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Publish Store" };

export default async function PublishStorePage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const store = await prisma.store.findFirst({ where: { id: params.id, userId: user.id } });
  if (!store) notFound();

  const checklist = await getPublishChecklist(params.id);
  if (!checklist) notFound();

  const connections = await prisma.shopifyConnection.findMany({ where: { userId: user.id, status: "CONNECTED" } });

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={`/stores/${store.id}`}>
          <ArrowLeft className="h-4 w-4" /> Back to editor
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Publish {store.name}</h1>
        <p className="text-sm text-muted-foreground">Review the checklist and publish this store as a Shopify product.</p>
      </div>

      <PublishFlow
        storeId={store.id}
        checklist={checklist.items}
        readyToPublish={checklist.readyToPublish}
        connections={connections}
        alreadyPublished={store.status === "PUBLISHED"}
      />
    </div>
  );
}
