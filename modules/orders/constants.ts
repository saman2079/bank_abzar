import type { ShippingSettings } from "@/modules/settings/constants";

export const ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "PENDING_CONFIRMATION",
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
  PENDING_CONFIRMATION: "در انتظار تأیید تلفنی",
  PAID: "پرداخت‌شده",
  PROCESSING: "در حال آماده‌سازی",
  SHIPPED: "ارسال‌شده",
  DELIVERED: "تحویل‌شده",
  CANCELED: "لغوشده",
  RETURNED: "مرجوع‌شده",
};

/** مهلت پرداخت سفارش؛ بعد از آن کرون سفارش را لغو و موجودی را برمی‌گرداند. */
export const ORDER_EXPIRY_MINUTES = 30;

export const PAYMENT_METHODS = ["ONLINE", "COD"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  ONLINE: "پرداخت آنلاین",
  COD: "پرداخت در محل",
};

/** سفارش پرداخت در محل اگر تا این مدت تأیید تلفنی نشود، لغو و موجودی آزاد می‌شود (ضد سفارش الکی). */
export const COD_CONFIRM_EXPIRY_HOURS = 48;

/** سقف سفارش «در انتظار تأیید تلفنی» هر مشتری؛ جلوی رزرو الکیِ موجودی را می‌گیرد. */
export const MAX_PENDING_COD_ORDERS = 2;

/** هزینه‌ی ارسال از تنظیمات فروشگاه می‌آید (`modules/settings`)؛ زیر حد رایگان = هزینه‌ی ثابت. */
export function calcShipping(subtotal: number, shipping: ShippingSettings): number {
  return subtotal >= shipping.freeOver ? 0 : shipping.flatCost;
}

/** شماره‌ی نمایشی سفارش (از ۱۰۰۱ شروع می‌شود). */
export function formatOrderNumber(number: number): string {
  return String(1000 + number);
}
