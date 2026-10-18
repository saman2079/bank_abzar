import "server-only";
import { writeAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/session";
import type { OrderStatus } from "../constants";
import { cancelPendingOrder } from "../service";
import { ADMIN_TRANSITIONS, NOTE_REQUIRED } from "./transitions";

export type ChangeStatusResult = { ok: true } | { ok: false; error: string };

/**
 * تغییر وضعیت سفارش توسط مدیر. هر گذار با `UPDATE ... WHERE status = وضعیت دیده‌شده` انجام می‌شود
 * تا دو مدیر همزمان (یا پرداخت/کرون همزمان) روی هم نوشته نشوند.
 * - لغو سفارش پرداخت‌شده: موجودی برمی‌گردد؛ بازگشت وجه به مشتری دستی از پنل زرین‌پال است.
 * - مرجوعی: برگشت به موجودی فقط اگر `restock` (کالا سالم است).
 */
export async function changeOrderStatus(
  actor: SessionUser,
  input: { orderId: string; to: OrderStatus; note: string | null; restock: boolean },
): Promise<ChangeStatusResult> {
  const order = await db.order.findUnique({ where: { id: input.orderId }, select: { id: true, status: true } });
  if (!order) return { ok: false, error: "سفارش پیدا نشد." };

  if (!ADMIN_TRANSITIONS[order.status].includes(input.to)) {
    return { ok: false, error: "این تغییر وضعیت مجاز نیست." };
  }
  if (NOTE_REQUIRED.includes(input.to) && (!input.note || input.note.length < 3)) {
    return { ok: false, error: "برای این تغییر، توضیح/دلیل (حداقل ۳ کاراکتر) لازم است." };
  }

  if (order.status === "PENDING_PAYMENT" && input.to === "CANCELED") {
    const canceled = await cancelPendingOrder(order.id, { actorId: actor.id, note: input.note ?? "لغو توسط مدیر" });
    if (!canceled) return { ok: false, error: "وضعیت سفارش همزمان تغییر کرد؛ صفحه را تازه کنید." };

    await writeAudit({
      actor,
      action: "order.status",
      entity: "order",
      entityId: order.id,
      diff: { from: order.status, to: input.to, note: input.note },
    });
    return { ok: true };
  }

  return db.$transaction(async (tx) => {
    const moved = await tx.order.updateMany({
      where: { id: order.id, status: order.status },
      data: { status: input.to, ...(input.to === "PAID" ? { expiresAt: null } : {}) },
    });
    if (moved.count === 0) return { ok: false, error: "وضعیت سفارش همزمان تغییر کرد؛ صفحه را تازه کنید." } as const;

    await tx.orderStatusHistory.create({
      data: { orderId: order.id, from: order.status, to: input.to, changedById: actor.id, note: input.note },
    });

    const restockType = input.to === "CANCELED" ? "ORDER_CANCEL" : input.to === "RETURNED" && input.restock ? "RETURN" : null;
    if (restockType) {
      const items = await tx.orderItem.findMany({
        where: { orderId: order.id },
        orderBy: { productId: "asc" },
        select: { productId: true, quantity: true },
      });
      for (const item of items) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
      }
      await tx.stockMovement.createMany({
        data: items.map((item) => ({
          productId: item.productId,
          delta: item.quantity,
          type: restockType,
          orderId: order.id,
          userId: actor.id,
          note: input.note,
        })),
      });
    }

    await writeAudit(
      {
        actor,
        action: "order.status",
        entity: "order",
        entityId: order.id,
        diff: { from: order.status, to: input.to, note: input.note, restock: restockType !== null },
      },
      tx,
    );
    return { ok: true } as const;
  });
}
