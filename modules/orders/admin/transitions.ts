import type { OrderStatus } from "../constants";

/** گذارهای مجاز وضعیت توسط مدیر. سفارش لغو/مرجوع‌شده نهایی است. */
export const ADMIN_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING_PAYMENT: ["PAID", "CANCELED"],
  /// پرداخت در محل: بعد از تماس، تأیید (آماده‌سازی) یا لغو
  PENDING_CONFIRMATION: ["PROCESSING", "CANCELED"],
  PAID: ["PROCESSING", "CANCELED"],
  PROCESSING: ["SHIPPED", "CANCELED"],
  SHIPPED: ["DELIVERED", "RETURNED"],
  DELIVERED: ["RETURNED"],
  CANCELED: [],
  RETURNED: [],
};

/** این گذارها دلیل/توضیح اجباری دارند (تأیید پرداخت دستی، لغو، مرجوعی). */
export const NOTE_REQUIRED: readonly OrderStatus[] = ["PAID", "CANCELED", "RETURNED"];
