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

export type KavenegarConfig = {
  apiKey: string;
  /** lookup: قالب تأییدشده (نیازمند سرویس پیشرفته)؛ send: پیامک ساده با متن مستقیم */
  method: "lookup" | "send";
  template: string;
  /** فقط برای send؛ خالی = خط پیش‌فرض حساب */
  sender?: string | undefined;
};

/** متن پیامک در حالت send (پیامک ساده). */
export function otpMessage(code: string): string {
  return `کد ورود شما به بانک ابزار: ${code}`;
}

/**
 * کاوه‌نگار — مستقیم با REST صدا زده می‌شود (پکیج npm `kavenegar` فقط پوشش callback-محور روی همین آدرس است).
 * - lookup: `/verify/lookup.json` با قالب تأییدشده؛ در حساب‌های بدون «سرویس پیشرفته» خطای ۴۲۶ می‌دهد.
 * - send: `/sms/send.json` با متن مستقیم (حساب رایگان).
 * کلید ناگزیر در مسیر URL است (طراحی کاوه‌نگار)؛ شماره/کد/متن در بدنه‌ی POST می‌روند.
 * ⚠️ حالت send با حساب واقعی هنوز تست نشده.
 */
export function createKavenegarSms(config: KavenegarConfig): SmsProvider {
  return {
    async sendOtp(phone, code) {
      const path = config.method === "lookup" ? "verify/lookup.json" : "sms/send.json";
      const url = new URL(`https://api.kavenegar.com/v1/${encodeURIComponent(config.apiKey)}/${path}`);

      const body =
        config.method === "lookup"
          ? new URLSearchParams({ receptor: phone, token: code, template: config.template })
          : new URLSearchParams({ receptor: phone, message: otpMessage(code) });
      if (config.method === "send" && config.sender) body.set("sender", config.sender);

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
