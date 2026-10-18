import "server-only";
import { writeAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/session";
import type { AdjustMode } from "./constants";

export type AdjustResult = { ok: true; slug: string; newStock: number } | { ok: false; error: string };

/**
 * تغییر دستی موجودی (ورود کالا، فروش حضوری، شمارش انبار) با ثبت دلیل اجباری.
 * - کاهش: `UPDATE ... WHERE stock >= n` اتمیک (هرگز منفی نمی‌شود)
 * - تنظیم: شرط `stock = مقدار دیده‌شده` (اگر همزمان عوض شده باشد رد می‌شود)
 * همیشه یک StockMovement + AuditLog در همان تراکنش.
 */
export async function adjustStock(
  actor: SessionUser,
  input: { productId: string; mode: AdjustMode; quantity: number; note: string },
): Promise<AdjustResult> {
  return db.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: input.productId },
      select: { id: true, slug: true, stock: true },
    });
    if (!product) return { ok: false, error: "محصول پیدا نشد." } as const;

    let delta: number;
    if (input.mode === "IN") {
      delta = input.quantity;
      await tx.product.update({ where: { id: product.id }, data: { stock: { increment: delta } } });
    } else if (input.mode === "OUT") {
      delta = -input.quantity;
      const updated = await tx.product.updateMany({
        where: { id: product.id, stock: { gte: input.quantity } },
        data: { stock: { decrement: input.quantity } },
      });
      if (updated.count === 0) return { ok: false, error: "موجودی برای این مقدار کافی نیست." } as const;
    } else {
      delta = input.quantity - product.stock;
      if (delta === 0) return { ok: false, error: "موجودی همین مقدار است؛ تغییری لازم نیست." } as const;

      const updated = await tx.product.updateMany({
        where: { id: product.id, stock: product.stock },
        data: { stock: input.quantity },
      });
      if (updated.count === 0) return { ok: false, error: "موجودی همزمان تغییر کرد؛ صفحه را تازه کنید و دوباره تلاش کنید." } as const;
    }

    const type = input.mode === "IN" ? "MANUAL_IN" : input.mode === "OUT" ? "MANUAL_OUT" : "ADJUSTMENT";
    await tx.stockMovement.create({
      data: { productId: product.id, delta, type, userId: actor.id, note: input.note },
    });
    await writeAudit(
      {
        actor,
        action: "stock.adjust",
        entity: "product",
        entityId: product.id,
        diff: { type, delta, before: product.stock, after: product.stock + delta, note: input.note },
      },
      tx,
    );

    return { ok: true, slug: product.slug, newStock: product.stock + delta } as const;
  });
}
