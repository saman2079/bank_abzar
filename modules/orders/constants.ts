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

/**
 * ⚠️ مقادیر نمونه تا وقتی صاحب فروشگاه روش و هزینه‌ی ارسال را مشخص کند.
 * در فاز ۶ به جدول Setting منتقل می‌شود. مبالغ به تومان.
 */
export const SHIPPING = { flatCost: 80_000, freeOver: 5_000_000 } as const;

export function calcShipping(subtotal: number): number {
  return subtotal >= SHIPPING.freeOver ? 0 : SHIPPING.flatCost;
}

/** شماره‌ی نمایشی سفارش (از ۱۰۰۱ شروع می‌شود). */
export function formatOrderNumber(number: number): string {
  return String(1000 + number);
}
