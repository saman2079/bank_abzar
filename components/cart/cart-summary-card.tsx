import { Card } from "@/components/ui/card";
import { formatToman } from "@/lib/format";

/** کارت خلاصه‌ی سفارش (بدون دسترسی به DB)؛ هم در سرور و هم در کلاینت (سبد با به‌روزرسانی آنی) قابل استفاده است. */
export function CartSummaryCard({
  subtotal,
  shipping,
  children,
}: {
  subtotal: number;
  shipping: number;
  children?: React.ReactNode;
}) {
  return (
    <Card className="space-y-3 p-5">
      <h2 className="font-extrabold">خلاصه سفارش</h2>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">جمع کالاها</dt>
          <dd>{formatToman(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">هزینه ارسال</dt>
          <dd>{shipping === 0 ? "رایگان" : formatToman(shipping)}</dd>
        </div>
        <div className="border-border flex justify-between border-t pt-3 text-base font-extrabold">
          <dt>مبلغ قابل پرداخت</dt>
          <dd>{formatToman(subtotal + shipping)}</dd>
        </div>
      </dl>
      {children}
    </Card>
  );
}
