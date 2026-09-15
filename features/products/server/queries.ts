import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { ProductFilterInput } from "@/features/products/schemas";

export async function searchProducts(filters: ProductFilterInput, userId: string) {
  // Product Finder results are scoped to the user who discovered them (each
  // discovery run creates rows owned by that user), so two users running the
  // same demo search each get their own copy rather than sharing one row.
  const where: Prisma.ProductWhereInput = { deletedAt: null, userId };

  if (filters.query) {
    where.title = { contains: filters.query, mode: "insensitive" };
  }
  if (filters.category) where.category = filters.category;
  if (filters.country) where.country = filters.country;
  if (filters.minPrice !== undefined) where.price = { ...(where.price as object), gte: filters.minPrice };
  if (filters.maxPrice !== undefined) where.price = { ...(where.price as object), lte: filters.maxPrice };
  if (filters.minMargin !== undefined) where.estimatedMargin = { gte: filters.minMargin };
  if (filters.minTrend !== undefined) where.trendScore = { gte: filters.minTrend };
  if (filters.maxCompetition !== undefined) where.competitionScore = { lte: filters.maxCompetition };
  if (filters.maxSaturation !== undefined) where.saturationScore = { lte: filters.maxSaturation };
  if (filters.savedOnly) where.saved = true;

  const orderByMap: Record<ProductFilterInput["sortBy"], Prisma.ProductOrderByWithRelationInput> = {
    winningScore: { winningScore: "desc" },
    price: { price: "asc" },
    margin: { estimatedMargin: "desc" },
    trend: { trendScore: "desc" },
    createdAt: { createdAt: "desc" },
  };

  return prisma.product.findMany({
    where,
    orderBy: orderByMap[filters.sortBy],
    take: 60,
  });
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({ where: { id }, include: { analyses: { orderBy: { createdAt: "desc" }, take: 1 } } });
}

export async function getProductCategories() {
  const rows = await prisma.product.findMany({
    where: { deletedAt: null, category: { not: null } },
    select: { category: true },
    distinct: ["category"],
  });
  return rows.map((r) => r.category!).filter(Boolean).sort();
}

export async function getProductCountries() {
  const rows = await prisma.product.findMany({
    where: { deletedAt: null, country: { not: null } },
    select: { country: true },
    distinct: ["country"],
  });
  return rows.map((r) => r.country!).filter(Boolean).sort();
}

export async function isProductSavedByUser(productId: string, userId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { userId: true, saved: true } });
  return !!product && product.userId === userId && product.saved;
}
