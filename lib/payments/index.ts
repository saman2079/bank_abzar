import "server-only";
import { env } from "@/lib/env";
import type { PaymentGateway } from "./types";
import { createZarinpalGateway } from "./zarinpal";

/** اگر مرچنت‌کد تنظیم نشده باشد null؛ پرداخت با پیام خطای واضح رد می‌شود (نه کرش). */
export function getPaymentGateway(): PaymentGateway | null {
  return env.ZARINPAL_MERCHANT_ID ? createZarinpalGateway(env.ZARINPAL_MERCHANT_ID) : null;
}
