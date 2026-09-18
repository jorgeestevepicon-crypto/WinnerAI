import Image from "next/image";
import { notFound } from "next/navigation";
import { getPublicStore } from "@/features/storefront/server/queries";
import { storeDocumentSchema } from "@/features/stores/schemas";
import { SectionRenderer } from "@/features/stores/components/store-editor/section-renderer";
import { BuyBox } from "@/features/storefront/components/buy-box";
import { integrations } from "@/config/env";

export const dynamic = "force-dynamic";

export default async function PublicStorePage({ params }: { params: { id: string } }) {
  const store = await getPublicStore(params.id);
  if (!store || !store.product) notFound();

  const document = storeDocumentSchema.parse(store.document);
  const visibleSections = document.sections.filter((s) => !s.hidden);

  return (
    <div className="flex min-h-screen flex-col" style={{ fontFamily: document.theme.bodyFont }}>
      <header
        className="flex items-center gap-2 border-b px-6 py-3"
        style={{ backgroundColor: document.theme.backgroundColor }}
      >
        {document.brand.logoUrl ? (
          <Image src={document.brand.logoUrl} alt={`${document.brand.name} logo`} width={28} height={28} className="h-7 w-7 rounded object-cover" unoptimized />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded bg-muted text-[10px] font-semibold text-muted-foreground">
            {document.brand.name.slice(0, 1).toUpperCase() || "?"}
          </div>
        )}
        <span className="text-sm font-semibold" style={{ color: document.theme.primaryColor, fontFamily: document.theme.headingFont }}>
          {document.brand.name}
        </span>
      </header>

      <main className="flex-1">
        {visibleSections.map((section) => (
          <SectionRenderer key={section.id} section={section} theme={document.theme} />
        ))}
      </main>

      <BuyBox
        storeId={store.id}
        price={store.product.price ?? 0}
        currency={store.product.currency}
        accentColor={document.theme.accentColor}
        checkoutConfigured={integrations.stripeConfigured}
      />
    </div>
  );
}
