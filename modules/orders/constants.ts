import type { ShippingSettings } from "@/modules/settings/constants";

export const ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELED",
  "RETURNED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "در انتظار پرداخت",
  PAID: "پرداخت‌شده",
  PROCESSING: "در حال آماده‌سازی",
  SHIPPED: "ارسال‌شده",
  DELIVERED: "تحویل‌شده",
  CANCELED: "لغوشده",
  RETURNED: "مرجوع‌شده",
};

/** مهلت پرداخت سفارش؛ بعد از آن کرون سفارش را لغو و موجودی را برمی‌گرداند. */
export const ORDER_EXPIRY_MINUTES = 30;

/** هزینه‌ی ارسال از تنظیمات فروشگاه می‌آید (`modules/settings`)؛ زیر حد رایگان = هزینه‌ی ثابت. */
export function calcShipping(subtotal: number, shipping: ShippingSettings): number {
  return subtotal >= shipping.freeOver ? 0 : shipping.flatCost;
}

/** شماره‌ی نمایشی سفارش (از ۱۰۰۱ شروع می‌شود). */
export function formatOrderNumber(number: number): string {
  return String(1000 + number);
}
