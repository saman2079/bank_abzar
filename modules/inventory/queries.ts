import "server-only";
import { db } from "@/lib/db";

export type LowStockItem = { id: string; name: string; sku: string; stock: number; lowStockThreshold: number };

/** محصولات فعال با موجودی ≤ آستانه‌ی خودشان (مقایسه‌ی دو ستون؛ فقط با SQL خام ممکن است). */
export async function listLowStock(limit = 50): Promise<LowStockItem[]> {
  return db.$queryRaw<LowStockItem[]>`
    SELECT "id", "name", "sku", "stock", "lowStockThreshold"
    FROM "Product"
    WHERE "status" = 'ACTIVE' AND "stock" <= "lowStockThreshold"
    ORDER BY "stock" ASC, "name" ASC
    LIMIT ${limit}
  `;
}

export async function getInventoryProduct(id: string) {
  return db.product.findUnique({
    where: { id },
    select: { id: true, name: true, sku: true, slug: true, stock: true, lowStockThreshold: true, status: true },
  });
}

export async function listStockMovements(productId: string, limit = 50) {
  const rows = await db.stockMovement.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      delta: true,
      type: true,
      note: true,
      createdAt: true,
      userId: true,
      order: { select: { id: true, number: true } },
    },
  });

  const userIds = [...new Set(rows.flatMap((row) => (row.userId ? [row.userId] : [])))];
  const users = await db.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, phone: true } });
  const labels = new Map(users.map((user) => [user.id, user.name ?? user.phone]));

  return rows.map((row) => ({ ...row, actor: row.userId ? (labels.get(row.userId) ?? "—") : "سیستم" }));
}
