import type { Metadata } from "next";
import Link from "next/link";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/dal";
import { formatDateTime, formatNumber, formatToman } from "@/lib/format";
import { formatOrderNumber } from "@/modules/orders/constants";
import { listMyOrders } from "@/modules/orders/queries";

export const metadata: Metadata = { title: "سفارش‌ها" };

export default async function OrdersPage() {
  const user = await requireUser("/account/orders");
  const orders = await listMyOrders(user.id);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-extrabold">سفارش‌های من</h1>

      {orders.length === 0 ? (
        <div className="space-y-4">
          <p className="text-muted text-sm">هنوز سفارشی ثبت نکرده‌اید.</p>
          <Link href="/products" className={buttonVariants({})}>
            مشاهده محصولات
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link href={`/account/orders/${order.id}`} className="block">
                <Card className="hover:border-primary flex flex-wrap items-center justify-between gap-3 p-4 transition-colors">
                  <div className="space-y-1">
                    <p className="font-bold">سفارش {formatNumber(Number(formatOrderNumber(order.number)))}</p>
                    <p className="text-muted text-xs">
                      {formatDateTime(order.createdAt)} · {formatNumber(order.itemCount)} قلم
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <OrderStatusBadge status={order.status} />
                    <span className="font-extrabold">{formatToman(order.total)}</span>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
