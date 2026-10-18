import { z } from "zod";
import type { SmsProvider } from "./types";

const responseSchema = z.object({ return: z.object({ status: z.number() }) });

/**
 * کاوه‌نگار — متد Verify Lookup (قالب تأییدشده در پنل).
 * ⚠️ این آداپتر از روی مستندات حافظه نوشته شده و با پنل واقعی تست نشده؛ قبل از production یک‌بار تست کن.
 */
export function createKavenegarSms(apiKey: string, template: string): SmsProvider {
  return {
    async sendOtp(phone, code) {
      const url = new URL(`https://api.kavenegar.com/v1/${encodeURIComponent(apiKey)}/verify/lookup.json`);
      url.searchParams.set("receptor", phone);
      url.searchParams.set("token", code);
      url.searchParams.set("template", template);

      const response = await fetch(url, { method: "GET", signal: AbortSignal.timeout(8000), cache: "no-store" });
      const body = responseSchema.safeParse(await response.json().catch(() => null));

      if (!response.ok || !body.success || body.data.return.status !== 200) {
        // هرگز URL (حاوی API key) یا کد را لاگ/پرتاب نکن.
        throw new Error(`Kavenegar request failed (http ${response.status})`);
      }
    },
  };
}
