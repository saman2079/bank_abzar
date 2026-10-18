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

  return consoleSms;
}

export const sms: SmsProvider = createProvider();