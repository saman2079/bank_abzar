import "server-only";
import { db } from "@/lib/db";
import type { OrderStatus, PaymentMethod } from "./constants";
import { addressSnapshotSchema } from "./schemas";
import type { OrderDetail, OrderListItem } from "./types";

/** همه‌ی کوئری‌های مشتری با `userId` فیلتر می‌شوند (ضد IDOR). */
export async function listMyOrders(userId: string): Promise<OrderListItem[]> {
  const rows = await db.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      number: true,
      status: true,
      total: true,
      createdAt: true,
      _count: { select: { items: true } },
    },
  });

  return rows.map(({ _count, ...row }) => ({ ...row, itemCount: _count.items }));
}

export async function getMyOrder(userId: string, id: string): Promise<OrderDetail | null> {
  const row = await db.order.findFirst({
    where: { id, userId },
    include: {
      items: { orderBy: { id: "asc" } },
      history: { orderBy: { createdAt: "asc" } },
      payments: {
        where: { status: "PAID" },
        orderBy: { paidAt: "desc" },
        take: 1,
        select: { refId: true, paidAt: true, needsRefund: true },
      },
    },
  });
  if (!row) return null;

  const address = addressSnapshotSchema.safeParse(row.addressSnapshot);

  return {
    id: row.id,
    number: row.number,
    status: row.status as OrderStatus,
    paymentMethod: row.paymentMethod as PaymentMethod,
    subtotal: row.subtotal,
    shippingCost: row.shippingCost,
    discount: row.discount,
    total: row.total,
    note: row.note,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    address: address.success ? address.data : null,
    items: row.items.map((item) => ({
      id: item.id,
      name: item.nameSnapshot,
      sku: item.skuSnapshot,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
    })),
    payment: row.payments[0] ?? null,
    history: row.history.map((entry) => ({
      id: entry.id,
      to: entry.to as OrderStatus,
      note: entry.note,
      createdAt: entry.createdAt,
    })),
  };
}
