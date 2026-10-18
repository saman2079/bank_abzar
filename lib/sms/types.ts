export interface SmsProvider {
  /** ارسال کد تأیید به شماره‌ی موبایل (قالب 09xxxxxxxxx). در صورت خطا throw می‌کند. */
  sendOtp(phone: string, code: string): Promise<void>;
}
