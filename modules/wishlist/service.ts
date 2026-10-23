import "server-only";
import { db } from "@/lib/db";
import { MAX_WISHLIST_ITEMS } from "./constants";

export type ToggleResult = { ok: true; favorited: boolean } | { ok: false; error: "not-found" | "limit" };

/** افزودن/حذف علاقه‌مندی. فقط محصول فعال اضافه می‌شود؛ حذف همیشه مجاز است. */
export async function toggleFavorite(userId: string, productId: string): Promise<ToggleResult> {
  const existing = await db.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
    select: { id: true },
  });

  if (existing) {
    await db.wishlistItem.deleteMany({ where: { userId, productId } });
    return { ok: true, favorited: false };
  }

  const product = await db.product.findFirst({ where: { id: productId, status: "ACTIVE" }, select: { id: true } });
  if (!product) return { ok: false, error: "not-found" };

  if ((await db.wishlistItem.count({ where: { userId } })) >= MAX_WISHLIST_ITEMS) return { ok: false, error: "limit" };

  // اگر دو درخواست همزمان آمد، یکتایی (userId, productId) جلوی تکرار را می‌گیرد.
  await db.wishlistItem.createMany({ data: [{ userId, productId }], skipDuplicates: true });
  return { ok: true, favorited: true };
}
