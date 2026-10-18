import "server-only";
import { env } from "@/lib/env";
import { consoleSms } from "./console";
import { createKavenegarSms } from "./kavenegar";
import type { SmsProvider } from "./types";

function createProvider(): SmsProvider {
  if (env.SMS_PROVIDER === "kavenegar") {
    // وجود کلید/قالب در lib/env.ts اعتبارسنجی می‌شود.
    return createKavenegarSms(env.SMS_API_KEY ?? "", env.SMS_OTP_TEMPLATE ?? "");
  }

  // `next build` همیشه NODE_ENV=production می‌گذارد؛ پس این محافظ هنگام «ارسال» اجرا می‌شود نه هنگام بارگذاری env.
  if (env.NODE_ENV === "production") {
    return {
      async sendOtp() {
        throw new Error("SMS_PROVIDER=console is not allowed in production; configure kavenegar");
      },
    };
  }

  return consoleSms;
}

export const sms: SmsProvider = createProvider();