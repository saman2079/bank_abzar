import type { SmsProvider } from "./types";

/** فقط توسعه‌ی محلی: کد در ترمینال سرور چاپ می‌شود. در production مجاز نیست (lib/env.ts). */
export const consoleSms: SmsProvider = {
  async sendOtp(phone, code) {
    console.warn(`[sms:console] OTP for ${phone}: ${code}`);
  },
};
