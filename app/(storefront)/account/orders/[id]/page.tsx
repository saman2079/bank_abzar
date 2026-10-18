import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { PayButton } from "@/components/orders/pay-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/dal";
import { formatDateTime, formatNumber, formatToman } from "@/lib/format";
import { cancelMyOrderAction } from "@/modules/orders/actions";
import { formatOrderNumber } from "@/modules/orders/constants";
import { getMyOrder } from "@/modules/orders/queries";

export const metadata: Metadata = { title: "جزئیات سفارش" };

type PaymentFlag = "paid" | "failed" | "pending";

const PAYMENT_BANNERS: Record<PaymentFlag, { text: string; tone: string }> = {
  paid: { text: "پرداخت با موفقیت انجام شد. سپاس از خرید شما.", tone: "border-emerald-500/50 text-emerald-400" },
  failed: { text: "پرداخت انجام نشد. در صورت کسر وجه، مبلغ تا ۷۲ ساعت به حساب شما برمی‌گردد. می‌توانید دوباره پرداخت کنید.", tone: "border-danger/50 text-danger" },
  pending: { text: "نتیجه‌ی پرداخت هنوز تأیید نشده است؛ چند دقیقه بعد همین صفحه را دوباره بررسی کنید.", tone: "border-primary/50 text-primary" },
};

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string | string[] }>;
}) {
  const [{ id }, { payment: paymentParam }] = await Promise.all([params, searchParams]);
  const flag = typeof paymentParam === "string" && paymentParam in PAYMENT_BANNERS ? (paymentParam as PaymentFlag) : null;
  const user = await requireUser(`/account/orders/${id}`);

  // فقط سفارش خود کاربر؛ سفارش دیگران ۴۰۴ می‌دهد (ضد IDOR).
  const order = await getMyOrder(user.id, id);
  if (!order) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-extrabold">سفارش {formatNumber(Number(formatOrderNumber(order.number)))}</h1>
        <OrderStatusBadge status={order.status} />
      </div>

      {flag ? (
        <Card role="status" className={`p-4 text-sm ${PAYMENT_BANNERS[flag].tone}`}>
          {PAYMENT_BANNERS[flag].text}
        </Card>
      ) : null}

      {order.payment?.needsRefund ? (
        <Card role="alert" className="border-danger/50 text-danger p-4 text-sm">
          پرداخت شما ثبت شد اما این سفارش پیش‌تر لغو شده بود. مبلغ به حساب شما بازگردانده می‌شود؛ برای پیگیری با پشتیبانی تماس بگیرید.
        </Card>
      ) : null}

      {order.status === "PENDING_PAYMENT" ? (
        <Card className="border-primary/50 space-y-3 p-5">
          <p className="text-sm">
            این سفارش در انتظار پرداخت است
            {order.expiresAt ? ` و تا ${formatDateTime(order.expiresAt)} نگه داشته می‌شود.` : "."}
          </p>
          <div className="flex flex-wrap gap-2">
            <PayButton orderId={order.id} />
            <form action={cancelMyOrderAction}>
              <input type="hidden" name="id" value={order.id} />
              <Button type="submit" variant="outline">
                لغو سفارش
              </Button>
            </form>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card className="space-y-3 p-5">
            <h2 className="font-bold">اقلام سفارش</h2>
            <ul className="divide-border divide-y text-sm">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 py-2">
                  <span>
                    {item.name} × {formatNumber(item.quantity)}
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
                <dt className="text-muted">هزینه ارسال</dt>
                <dd>{order.shippingCost === 0 ? "رایگان" : formatToman(order.shippingCost)}</dd>
              </div>
              <div className="flex justify-between text-base font-extrabold">
                <dt>مبلغ کل</dt>
                <dd>{formatToman(order.total)}</dd>
              </div>
            </dl>
          </Card>

          {order.address ? (
            <Card className="space-y-2 p-5 text-sm">
              <h2 className="font-bold">آدرس تحویل</h2>
              <p className="text-muted leading-7">
                {order.address.receiverName} — <bdi dir="ltr">{order.address.receiverPhone}</bdi>
                <br />
                {order.address.province}، {order.address.city}، {order.address.street}، پلاک {order.address.plaque}
                {order.address.unit ? `، واحد ${order.address.unit}` : ""} — کدپستی{" "}
                <bdi dir="ltr">{order.address.postalCode}</bdi>
              </p>
              {order.note ? <p className="text-muted">توضیحات: {order.note}</p> : null}
            </Card>
          ) : null}
        </div>

        <Card className="space-y-4 p-5">
          <h2 className="font-bold">وضعیت سفارش</h2>
          <OrderTimeline history={order.history} />
          {order.payment?.refId ? (
            <p className="text-muted border-border border-t pt-3 text-xs">
              کد پیگیری پرداخت: <bdi dir="ltr">{order.payment.refId}</bdi>
            </p>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
