import { z } from "zod";
import type { SmsProvider } from "./types";

/**
 * پاسخ REST کاوه‌نگار: `{ return: { status, message }, entries: [...] }`؛ status=200 یعنی موفق.
 * در خطا هم `return.status` کد خطای کاوه‌نگار است (نه لزوماً کد HTTP).
 */
const responseSchema = z.object({ return: z.object({ status: z.number(), message: z.string().optional() }) });

const TIMEOUT_MS = 8000;

/** کد خطای کاوه‌نگار را نگه می‌دارد تا در لاگ سرور قابل تشخیص باشد (کلید API و کد OTP هرگز در پیام نیست). */
export class KavenegarError extends Error {
  constructor(
    readonly httpStatus: number,
    readonly kavenegarStatus: number | null,
  ) {
    super(`Kavenegar request failed (http ${httpStatus}, kavenegar ${kavenegarStatus ?? "unknown"})`);
    this.name = "KavenegarError";
  }
}

/**
 * کاوه‌نگار — متد Verify Lookup (قالب تأییدشده در پنل، توکن = کد OTP).
 * مستقیم با REST (`/v1/{apikey}/verify/lookup.json`) صدا زده می‌شود؛ پکیج npm `kavenegar` فقط پوشش callback-محور
 * روی همین آدرس است و وابستگی اضافه می‌آورد، پس استفاده نشده.
 * ⚠️ با پنل و قالب واقعی هنوز تست نشده؛ قبل از production یک پیامک واقعی بفرست.
 */
export function createKavenegarSms(apiKey: string, template: string): SmsProvider {
  return {
    async sendOtp(phone, code) {
      const url = new URL(`https://api.kavenegar.com/v1/${encodeURIComponent(apiKey)}/verify/lookup.json`);

      // POST با بدنه‌ی فرم: شماره و کد در URL (و لاگ‌های پراکسی) نمی‌مانند. کلید ناگزیر در مسیر است (طراحی کاوه‌نگار).
      const body = new URLSearchParams({ receptor: phone, token: code, template });

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      });

      const parsed = responseSchema.safeParse(await response.json().catch(() => null));
      const kavenegarStatus = parsed.success ? parsed.data.return.status : null;

      if (!response.ok || kavenegarStatus !== 200) {
        throw new KavenegarError(response.status, kavenegarStatus);
      }
    },
  };
}
