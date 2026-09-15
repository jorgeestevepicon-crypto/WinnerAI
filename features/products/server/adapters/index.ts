import type { ProductSourceAdapter } from "@/features/products/types";
import { demoProductSourceAdapter } from "@/features/products/server/adapters/demo-adapter";
import { externalProductSourceAdapters } from "@/features/products/server/adapters/external-adapters";

export const productSourceAdapters: ProductSourceAdapter[] = [demoProductSourceAdapter, ...externalProductSourceAdapters];

export function getProductSourceAdapter(id: string): ProductSourceAdapter | undefined {
  return productSourceAdapters.find((adapter) => adapter.id === id);
}

export { demoProductSourceAdapter };
