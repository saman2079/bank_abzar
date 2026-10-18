import "server-only";
import { db } from "@/lib/db";
import { startOfTehranDay } from "@/lib/date";
import type { OrderStatus } from "@/modules/orders/constants";
import { listLowStock } from "@/modules/inventory/queries";

/** فروش = سفارش‌هایی که پرداخت شده‌اند و لغو/مرجوع نشده‌اند. */
const SALES_STATUSES: OrderStatus[] = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"];

export async function getDashboard() {
  const todayStart = startOfTehranDay();
  const monthStart = startOfTehranDay(new Date(), 29);

  const sales = (since: Date) =>
    db.order.aggregate({
      where: { status: { in: SALES_STATUSES }, createdAt: { gte: since } },
      _sum: { total: true },
      _count: true,
    });

  const [today, month, awaitingProcessing, pendingPayment, refunds, lowStock, recent] = await Promise.all([
    sales(todayStart),
    sales(monthStart),
    db.order.count({ where: { status: "PAID" } }),
    db.order.count({ where: { status: "PENDING_PAYMENT" } }),
    db.payment.count({ where: { needsRefund: true } }),
    listLowStock(10),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, number: true, status: true, total: true, createdAt: true, user: { select: { name: true, phone: true } } },
    }),
  ]);

  return {
    today: { total: today._sum.total ?? 0, count: today._count },
    month: { total: month._sum.total ?? 0, count: month._count },
    awaitingProcessing,
    pendingPayment,
    refunds,
    lowStock,
    recent: recent.map((order) => ({ ...order, status: order.status as OrderStatus })),
  };
}
