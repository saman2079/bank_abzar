import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { PageHeader } from "@/components/admin/page-header";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Card } from "@/components/ui/card";
import { requireStaff } from "@/lib/dal";
import { formatDateTime, formatNumber, formatToman } from "@/lib/format";
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, formatOrderNumber } from "@/modules/orders/constants";
import { getAdminOrder } from "@/modules/orders/admin/queries";
import { ADMIN_TRANSITIONS } from "@/modules/orders/admin/transitions";

export const metadata: Metadata = { title: "جزئیات سفارش" };

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;

  const order = await getAdminOrder(id);
  if (!order) notFound();

  const needsRefund = order.payments.some((payment) => payment.needsRefund);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <PageHeader title={`سفارش ${formatNumber(Number(formatOrderNumber(order.number)))}`} />
        <OrderStatusBadge status={order.status} />
      </div>

      {order.status === "PENDING_CONFIRMATION" ? (
        <Card className="border-primary/50 space-y-2 p-5 text-sm leading-7">
          <p className="font-bold">پرداخت در محل — منتظر تماس تلفنی</p>
          <p>
            با مشتری تماس بگیرید و واقعی‌بودن سفارش را بررسی کنید:{" "}
            <a href={`tel:${order.address?.receiverPhone ?? order.user.phone}`} className="text-primary font-bold" dir="ltr">
              {order.address?.receiverPhone ?? order.user.phone}
            </a>
            {order.address && order.address.receiverPhone !== order.user.phone ? (
              <>
                {" "}
                (شماره‌ی حساب:{" "}
                <a href={`tel:${order.user.phone}`} className="text-primary" dir="ltr">
                  {order.user.phone}
                </a>
                )
              </>
            ) : null}
            . اگر تأیید شد وضعیت را «{ORDER_STATUS_LABELS.PROCESSING}» کنید؛ در غیر این صورت «{ORDER_STATUS_LABELS.CANCELED}» (موجودی برمی‌گردد).
            نتیجه‌ی تماس را در «توضیح» بنویسید تا در تاریخچه بماند.
            {order.expiresAt ? ` مهلت: ${formatDateTime(order.expiresAt)} (بعد از آن خودکار لغو می‌شود).` : ""}
          </p>
        </Card>
      ) : null}

      {needsRefund ? (
        <Card role="alert" className="border-danger/50 text-danger p-4 text-sm">
          پرداخت این سفارش پس از لغو دریافت شد و بازگشایی ممکن نبود: مبلغ را از پنل زرین‌پال به مشتری برگردانید.
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card className="space-y-3 p-5">
            <h2 className="font-bold">اقلام</h2>
            <ul className="divide-border divide-y text-sm">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 py-2">
                  <span>
                    <Link href={`/admin/products/${item.productId}`} className="hover:underline">
                      {item.nameSnapshot}
                    </Link>{" "}
                    <span className="text-muted">
                      ({item.skuSnapshot}) × {formatNumber(item.quantity)}
                    </span>
                  </span>
                  <span className="shrink-0">{formatToman(item.unitPrice * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="border-border space-y-1 border-t pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">جمع کالاها</dt>
                <dd>{formatToman(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">ارسال</dt>
                <dd>{order.shippingCost === 0 ? "رایگان" : formatToman(order.shippingCost)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">روش پرداخت</dt>
                <dd>{PAYMENT_METHOD_LABELS[order.paymentMethod]}</dd>
              </div>
              <div className="flex justify-between text-base font-extrabold">
                <dt>مبلغ کل</dt>
                <dd>{formatToman(order.total)}</dd>
              </div>
            </dl>
          </Card>

          <Card className="space-y-2 p-5 text-sm">
            <h2 className="font-bold">مشتری و آدرس</h2>
            <p>
              <Link href={`/admin/users/${order.user.id}`} className="text-primary hover:underline">
                {order.user.name ?? "بدون نام"}
              </Link>{" "}
              — <bdi dir="ltr">{order.user.phone}</bdi>
              {order.createdByLabel && order.createdById !== order.user.id ? (
                <span className="text-muted"> (ثبت‌شده توسط {order.createdByLabel})</span>
              ) : null}
            </p>
            {order.address ? (
              <p className="text-muted leading-7">
                {order.address.receiverName} — <bdi dir="ltr">{order.address.receiverPhone}</bdi>
                <br />
                {order.address.province}، {order.address.city}، {order.address.street}، پلاک {order.address.plaque}
                {order.address.unit ? `، واحد ${order.address.unit}` : ""} — کدپستی <bdi dir="ltr">{order.address.postalCode}</bdi>
              </p>
            ) : null}
            {order.note ? <p className="text-muted">توضیحات مشتری: {order.note}</p> : null}
          </Card>

          <Card className="space-y-3 p-5 text-sm">
            <h2 className="font-bold">پرداخت‌ها</h2>
            {order.payments.length === 0 ? (
              <p className="text-muted">
                {order.paymentMethod === "COD" ? "پرداخت در محل؛ مبلغ هنگام تحویل از مشتری دریافت می‌شود." : "پرداخت آنلاینی ثبت نشده است."}
              </p>
            ) : (
              <ul className="divide-border divide-y">
                {order.payments.map((payment) => (
                  <li key={payment.id} className="flex flex-wrap justify-between gap-2 py-2">
                    <span>
                      {payment.gateway} — {formatToman(payment.amount)} —{" "}
                      {payment.status === "PAID" ? "موفق" : payment.status === "FAILED" ? "ناموفق" : "در انتظار"}
                    </span>
                    <span className="text-muted" dir="ltr">
                      {payment.refId ?? "—"} · {formatDateTime(payment.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="space-y-4 p-5">
            <h2 className="font-bold">تغییر وضعیت</h2>
            <OrderStatusForm orderId={order.id} allowed={ADMIN_TRANSITIONS[order.status]} />
            {order.status === "PAID" || order.status === "PROCESSING" ? (
              <p className="text-muted text-xs">لغو سفارش پرداخت‌شده، موجودی را برمی‌گرداند؛ بازگشت وجه به مشتری دستی از پنل زرین‌پال است.</p>
            ) : null}
          </Card>

          <Card className="space-y-4 p-5">
            <h2 className="font-bold">تاریخچه</h2>
            <ol className="border-border space-y-4 border-s ps-5 text-sm">
              {order.history.map((entry) => (
                <li key={entry.id} className="relative">
                  <span className="bg-primary absolute -start-[27px] top-1.5 size-3 rounded-full" aria-hidden />
                  <p className="font-bold">{ORDER_STATUS_LABELS[entry.to]}</p>
                  <p className="text-muted text-xs">
                    {formatDateTime(entry.createdAt)} · {entry.actor ?? "سیستم/مشتری"}
                  </p>
                  {entry.note ? <p className="text-muted mt-1 text-xs">{entry.note}</p> : null}
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
