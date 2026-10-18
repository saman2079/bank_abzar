import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import type { Prisma } from "../generated/prisma/client";
import { discountPercent } from "../lib/format";
import { mockCategories, mockProducts } from "../modules/catalog/mock-data";

config({ path: [".env.local", ".env"] });

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Seed قابل اجرای مجدد است (upsert بر اساس slug). */
async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const categoryIds = new Map<string, string>();
    for (const [index, category] of mockCategories.entries()) {
      const row = await prisma.category.upsert({
        where: { slug: category.slug },
        update: { name: category.name, sortOrder: index },
        create: { name: category.name, slug: category.slug, sortOrder: index },
      });
      categoryIds.set(category.slug, row.id);
    }

    const brandIds = new Map<string, string>();
    for (const name of new Set(mockProducts.map((product) => product.brand))) {
      const slug = slugify(name);
      const row = await prisma.brand.upsert({
        where: { slug },
        update: { name },
        create: { name, slug },
      });
      brandIds.set(name, row.id);
    }

    for (const product of mockProducts) {
      const categoryId = categoryIds.get(product.categorySlug);
      const brandId = brandIds.get(product.brand);
      if (!categoryId || !brandId) {
        throw new Error(`Missing category/brand for product ${product.slug}`);
      }

      const data = {
        sku: product.sku,
        name: product.name,
        slug: product.slug,
        brandId,
        categoryId,
        shortDescription: product.shortDescription,
        description: product.description,
        price: product.price,
        compareAtPrice: product.compareAtPrice ?? null,
        discountPercent: discountPercent(product.price, product.compareAtPrice),
        status: "ACTIVE",
        specs: product.specs,
        ratingAvg: product.rating,
        ratingCount: product.ratingCount,
      } satisfies Prisma.ProductUncheckedCreateInput;

      // موجودی فقط هنگام ساخت می‌آید؛ بازاجرای seed آن را دست نمی‌زند (منبع حقیقت: دفتر StockMovement).
      const row = await prisma.product.upsert({
        where: { slug: product.slug },
        update: data,
        create: { ...data, stock: product.stock },
        select: { id: true, stock: true },
      });

      const hasLedger = (await prisma.stockMovement.count({ where: { productId: row.id } })) > 0;
      if (!hasLedger && row.stock > 0) {
        await prisma.stockMovement.create({
          data: { productId: row.id, delta: row.stock, type: "INITIAL", note: "موجودی اولیه (seed)" },
        });
      }
    }

    process.stdout.write(
      `Seeded ${mockCategories.length} categories, ${brandIds.size} brands, ${mockProducts.length} products\n`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
