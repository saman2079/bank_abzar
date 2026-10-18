import { z } from "zod";
import type { PaymentGateway, PaymentVerifyResult } from "./types";

const API = "https://api.zarinpal.com/pg/v4/payment";
const START_PAY = "https://www.zarinpal.com/pg/StartPay/";
/** تومان → ریال؛ مقدار `amount` در API زرین‌پال ریال است. */
const TOMAN_TO_RIAL = 10;

const envelopeSchema = z.object({ data: z.unknown().optional(), errors: z.unknown().optional() });
const errorSchema = z.object({ code: z.number().optional(), message: z.string().optional() });
const requestDataSchema = z.object({ code: z.number(), authority: z.string().min(1) });
const verifyDataSchema = z.object({
  code: z.number(),
  ref_id: z.union([z.number(), z.string()]).optional(),
  card_pan: z.string().nullish(),
});

async function post(path: "request" | "verify", body: unknown) {
  const response = await fetch(`${API}/${path}.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });

  const parsed = envelopeSchema.safeParse(await response.json().catch(() => null));
  // خطای انتقال/سرور (نه پاسخ قطعی درگاه) → throw تا فراخواننده بعداً دوباره تلاش کند.
  if (response.status >= 500 || !parsed.success) {
    throw new Error(`Zarinpal ${path} transport error (http ${response.status})`);
  }

  const error = errorSchema.safeParse(parsed.data.errors);
  return {
    data: parsed.data.data,
    errorCode: error.success ? (error.data.code ?? null) : null,
    errorMessage: error.success ? (error.data.message ?? null) : null,
  };
}

/**
 * زرین‌پال API v4 (production؛ بدون sandbox).
 * مستندات: https://www.zarinpal.com/docs/paymentGateway/connectToGateway
 */
export function createZarinpalGateway(merchantId: string): PaymentGateway {
  return {
    name: "zarinpal",

    async request({ amountToman, callbackUrl, description, mobile }) {
      const result = await post("request", {
        merchant_id: merchantId,
        amount: amountToman * TOMAN_TO_RIAL,
        callback_url: callbackUrl,
        description,
        ...(mobile ? { metadata: { mobile } } : {}),
      });

      const data = requestDataSchema.safeParse(result.data);
      if (!data.success || data.data.code !== 100) {
        // merchantId هرگز در پیام خطا نمی‌آید.
        throw new Error(`Zarinpal request rejected (code ${result.errorCode ?? "?"}): ${result.errorMessage ?? "unknown"}`);
      }

      return { authority: data.data.authority, redirectUrl: `${START_PAY}${data.data.authority}` };
    },

    async verify({ authority, amountToman }): Promise<PaymentVerifyResult> {
      const result = await post("verify", {
        merchant_id: merchantId,
        amount: amountToman * TOMAN_TO_RIAL,
        authority,
      });

      const data = verifyDataSchema.safeParse(result.data);
      // ۱۰۰: تأیید اول — ۱۰۱: قبلاً تأیید شده (فراخوانی تکراری)
      if (data.success && (data.data.code === 100 || data.data.code === 101)) {
        return {
          ok: true,
          refId: String(data.data.ref_id ?? ""),
          cardPan: data.data.card_pan ?? null,
          alreadyVerified: data.data.code === 101,
        };
      }

      return {
        ok: false,
        code: data.success ? data.data.code : result.errorCode,
        message: result.errorMessage ?? "تراکنش تأیید نشد",
      };
    },
  };
}
