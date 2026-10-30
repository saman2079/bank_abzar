import { calcShipping } from "@/modules/orders/constants";
import { getShippingSettings } from "@/modules/settings/queries";
import { CartSummaryCard } from "./cart-summary-card";

/** هزینه‌ی ارسال از تنظیمات ادمین (کش‌شده) خوانده می‌شود؛ مبلغ نهایی واقعی هنگام ثبت سفارش سمت سرور محاسبه می‌شود. */
export async function CartSummary({ subtotal, children }: { subtotal: number; children?: React.ReactNode }) {
  const shipping = calcShipping(subtotal, await getShippingSettings());

  return (
    <CartSummaryCard subtotal={subtotal} shipping={shipping}>
      {children}
    </CartSummaryCard>
  );
}
