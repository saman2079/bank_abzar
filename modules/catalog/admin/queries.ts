import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { productSpecsSchema } from "../schemas";

export const ADMIN_PAGE_SIZE = 20;

export type AdminProductFilters = { q?: string; status?: "DRAFT" | "ACTIVE" | "ARCHIVED"; page: number };

export async function listAdminProducts({ q, status, page }: AdminProductFilters) {
  const where: Prisma.ProductWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
            { brand: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        sku: true,
        slug: true,
        price: true,
        stock: true,
        lowStockThreshold: true,
        status: true,
        brand: { select: { name: true } },
        category: { select: { name: true } },
      },
    }),
  ]);

  return { items, total, totalPages: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) };
}

export async function getAdminProduct(id: string) {
  const row = await db.product.findUnique({
    where: { id },
    include: { images: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }], select: { id: true, url: true, alt: true } } },
  });
  if (!row) return null;

  const specs = productSpecsSchema.safeParse(row.specs);
  return { ...row, specs: specs.success ? specs.data : [] };
}

export type AdminProduct = NonNullable<Awaited<ReturnType<typeof getAdminProduct>>>;

export async function listBrandOptions() {
  return db.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
}

export async function listCategoryOptions() {
  return db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } });
}

export async function listAdminCategories() {
  return db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      sortOrder: true,
      parent: { select: { name: true } },
      _count: { select: { products: true, children: true } },
    },
  });
}

export async function getAdminCategory(id: string) {
  return db.category.findUnique({ where: { id } });
}

export async function listAdminBrands() {
  return db.brand.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, _count: { select: { products: true } } },
  });
}

export async function getAdminBrand(id: string) {
  return db.brand.findUnique({ where: { id } });
}
