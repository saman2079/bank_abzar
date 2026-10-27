import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Card } from "@/components/ui/card";
import { requireStaff } from "@/lib/dal";
import { formatDateTime, formatNumber, formatToman } from "@/lib/format";
import { getDashboard } from "@/modules/dashboard/queries";
import { formatOrderNumber } from "@/modules/orders/constants";

export const metadata: Metadata = { title: "داشبورد" };

function Stat({ label, value, sub, href, alert }: { label: string; value: string; sub?: string; href?: string; alert?: boolean }) {
  const body = (
    <Card className={`p-4 ${alert ? "border-danger/50" : ""}`}>
      <p className="text-muted text-xs">{label}</p>
      <p className={`mt-1 text-lg font-extrabold ${alert ? "text-danger" : ""}`}>{value}</p>
      {sub ? <p className="text-muted mt-0.5 text-xs">{sub}</p> : null}
    </Card>
  );

  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

export default async function AdminDashboardPage() {
  await requireStaff();
  const data = await getDashboard();

  return (
    <div className="space-y-6">
      <PageHeader title="داشبورد" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="فروش امروز" value={formatToman(data.today.total)} sub={`${formatNumber(data.today.count)} سفارش`} />
        <Stat label="فروش ۳۰ روز اخیر" value={formatToman(data.month.total)} sub={`${formatNumber(data.month.count)} سفارش`} />
        <Stat
          label="پرداخت‌شده، منتظر پردازش"
          value={formatNumber(data.awaitingProcessing)}
          href="/admin/orders?status=PAID"
          alert={data.awaitingProcessing > 0}
        />
        <Stat
          label="پرداخت در محل، منتظر تماس"
          value={formatNumber(data.pendingConfirmation)}
          href="/admin/orders?status=PENDING_CONFIRMATION"
          alert={data.pendingConfirmation > 0}
        />
        <Stat label="در انتظار پرداخت" value={formatNumber(data.pendingPayment)} href="/admin/orders?status=PENDING_PAYMENT" />
        <Stat label="نیازمند بازگشت وجه" value={formatNumber(data.refunds)} alert={data.refunds > 0} />
        <Stat label="کم‌موجودی" value={formatNumber(data.lowStock.length)} href="/admin/inventory" alert={data.lowStock.length > 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-3 p-5">
          <h2 className="font-bold">آخرین سفارش‌ها</h2>
          {data.recent.length === 0 ? (
            <p className="text-muted text-sm">هنوز سفارشی ثبت نشده است.</p>
          ) : (
            <ul className="divide-border divide-y text-sm">
              {data.recent.map((order) => (
                <li key={order.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <Link href={`/admin/orders/${order.id}`} className="font-bold hover:underline">
                    {formatNumber(Number(formatOrderNumber(order.number)))}
                  </Link>
                  <span className="text-muted">{order.user.name ?? order.user.phone}</span>
                  <OrderStatusBadge status={order.status} />
                  <span>{formatToman(order.total)}</span>
                  <span className="text-muted text-xs">{formatDateTime(order.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="space-y-3 p-5">
          <h2 className="font-bold">کم‌موجودی‌ها</h2>
          {data.lowStock.length === 0 ? (
            <p className="text-muted text-sm">همه‌ی محصولات موجودی کافی دارند.</p>
          ) : (
            <ul className="divide-border divide-y text-sm">
              {data.lowStock.map((item) => (
                <li key={item.id} className="flex justify-between gap-2 py-2">
                  <Link href={`/admin/inventory/${item.id}`} className="hover:underline">
                    {item.name}
                  </Link>
                  <span className={item.stock === 0 ? "text-danger font-bold" : ""}>{formatNumber(item.stock)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
