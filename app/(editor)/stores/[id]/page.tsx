import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getStoreById } from "@/features/stores/server/queries";
import { storeDocumentSchema } from "@/features/stores/schemas";
import { StoreEditor } from "@/features/stores/components/store-editor";

export const metadata = { title: "Store Editor" };

export default async function StoreEditorPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const store = await getStoreById(params.id, user.id);
  if (!store) notFound();

  const document = storeDocumentSchema.parse(store.document);
  const versions = store.versions.map((v) => ({ version: v.version, createdBy: v.createdBy ?? "user", createdAt: v.createdAt }));

  return <StoreEditor storeId={store.id} storeName={store.name} initialDocument={document} initialVersions={versions} />;
}
