import { notFound } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getStoreById } from "@/features/stores/server/queries";
import { storeDocumentSchema } from "@/features/stores/schemas";
import { StoreEditor } from "@/features/stores/components/store-editor";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata = { title: "Store Editor" };

export default async function StoreEditorPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const store = await getStoreById(params.id, user.id);
  if (!store) notFound();

  if (store.status === "GENERATING") {
    return (
      <div className="flex h-screen items-center justify-center">
        <EmptyState icon={Loader2} title="Generating your store" description="This usually takes a few seconds. Refresh the page in a moment." />
      </div>
    );
  }

  if (store.status === "ERROR") {
    return (
      <div className="flex h-screen items-center justify-center">
        <EmptyState
          icon={AlertTriangle}
          title="Store generation failed"
          description="Something went wrong while generating this store. Go back to the Store Builder and try again."
        />
      </div>
    );
  }

  const document = storeDocumentSchema.parse(store.document);
  const versions = store.versions.map((v) => ({ version: v.version, createdBy: v.createdBy ?? "user", createdAt: v.createdAt }));

  return <StoreEditor storeId={store.id} storeName={store.name} initialDocument={document} initialVersions={versions} />;
}
