import { cacheLife, cacheTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";
import { db } from "@/lib/db";
import { normalizePersianChars } from "@/lib/text";
import type { Prisma } from "@/generated/prisma/client";
import { PAGE_SIZE, type ProductSort } from "./constants";
import { productSpecsSchema, type ProductListQuery } from "./schemas";
import type { CategorySummary, ProductDetail } from "./types";

export type ProductPage = {
  items: ProductDetail[];
  total: number;
  page: number;
  totalPages: number;
};

const productInclude = {
  brand: { select: { name: true } },
  category: { select: { slug: true } },
} satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

function toProductDetail(row: ProductRow): ProductDetail {
  const specs = productSpecsSchema.safeParse(row.specs);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand.name,
    price: row.price,
    compareAtPrice: row.compareAtPrice ?? undefined,
    rating: row.ratingAvg,
    ratingCount: row.ratingCount,
    inStock: row.stock > 0,
    sku: row.sku,
    categorySlug: row.category.slug,
    stock: row.stock,
    shortDescription: row.shortDescription,
    description: row.description,
    specs: specs.success ? specs.data : [],
  };
}

const orderBy: Record<ProductSort, Prisma.ProductOrderByWithRelationInput[]> = {
  newest: [{ createdAt: "desc" }, { id: "asc" }],
  "price-asc": [{ price: "asc" }, { id: "asc" }],
  "price-desc": [{ price: "desc" }, { id: "asc" }],
  discount: [{ discountPercent: "desc" }, { id: "asc" }],
  rating: [{ ratingAvg: "desc" }, { id: "asc" }],
};

function buildWhere(query: ProductListQuery): Prisma.ProductWhereInput {
  const term = query.q ? normalizePersianChars(query.q) : undefined;

  return {
    status: "ACTIVE",
    ...(query.category && { category: { slug: query.category } }),
    ...(query.brand && { brand: { name: query.brand } }),
    ...(term && {
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { brand: { name: { contains: term, mode: "insensitive" } } },
      ],
    }),
  };
}

async function queryProducts(query: ProductListQuery): Promise<ProductPage> {
  const where = buildWhere(query);
  const total = await db.product.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(query.page, totalPages);

  const rows = await db.product.findMany({
    where,
    orderBy: orderBy[query.sort],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: productInclude,
  });

  return { items: rows.map(toProductDetail), total, page, totalPages };
}

async function queryProductsCached(query: ProductListQuery): Promise<ProductPage> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.catalog);

  return queryProducts(query);
}

/** جستجوی آزاد (`q`) کش نمی‌شود چون کلید کش نامحدود می‌سازد؛ بقیه‌ی ترکیب‌ها کش می‌شوند. */
export async function listProducts(query: ProductListQuery): Promise<ProductPage> {
  return query.q ? queryProducts(query) : queryProductsCached(query);
}

export async function listFeaturedProducts(limit = 5): Promise<ProductDetail[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.catalog);

  const rows = await db.product.findMany({
    where: { status: "ACTIVE", stock: { gt: 0 }, discountPercent: { gt: 0 } },
    orderBy: [{ discountPercent: "desc" }, { id: "asc" }],
    take: limit,
    include: productInclude,
  });

  return rows.map(toProductDetail);
}

export async function listBrands(): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.brands);

  const rows = await db.brand.findMany({
    where: { products: { some: { status: "ACTIVE" } } },
    orderBy: { name: "asc" },
    select: { name: true },
  });

  return rows.map((row) => row.name);
}

export async function listCategories(): Promise<CategorySummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.categories);

  return db.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { slug: true, name: true },
  });
}

export async function getCategoryBySlug(slug: string): Promise<CategorySummary | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.categories);

  return db.category.findFirst({
    where: { slug, isActive: true },
    select: { slug: true, name: true },
  });
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.product(slug));

  const row = await db.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: productInclude,
  });

  return row ? toProductDetail(row) : null;
}

/** محصولات هم‌دسته (به‌جز خود محصول). */
export async function getRelatedProducts(slug: string, limit = 4): Promise<ProductDetail[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.catalog);

  const current = await db.product.findFirst({
    where: { slug, status: "ACTIVE" },
    select: { id: true, categoryId: true },
  });
  if (!current) return [];

  const rows = await db.product.findMany({
    where: { status: "ACTIVE", categoryId: current.categoryId, id: { not: current.id } },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: limit,
    include: productInclude,
  });

  return rows.map(toProductDetail);
}

/** فقط برای `generateStaticParams` (زمان build)؛ کش نمی‌شود. */
export async function listProductSlugs(): Promise<string[]> {
  const rows = await db.product.findMany({
    where: { status: "ACTIVE" },
    select: { slug: true },
  });

  return rows.map((row) => row.slug);
}