import "server-only";
import { db } from "@/lib/db";
import { productInclude, toProductDetail } from "@/modules/catalog/queries";
import type { ProductSummary } from "@/modules/catalog/types";
import { MAX_WISHLIST_ITEMS } from "./constants";

/** شناسه‌ی علاقه‌مندی‌های کاربر (برای پر کردن قلب‌ها). */
export async function listFavoriteIds(userId: string): Promise<string[]> {
  const rows = await db.wishlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: MAX_WISHLIST_ITEMS,
    select: { productId: true },
  });

  return rows.map((row) => row.productId);
}

/** محصولات فعالِ علاقه‌مندی کاربر، تازه‌ترین اول. */
export async function listFavoriteProducts(userId: string): Promise<ProductSummary[]> {
  const rows = await db.wishlistItem.findMany({
    where: { userId, product: { status: "ACTIVE" } },
    orderBy: { createdAt: "desc" },
    take: MAX_WISHLIST_ITEMS,
    select: { product: { include: productInclude } },
  });

  return rows.map((row) => toProductDetail(row.product));
}
