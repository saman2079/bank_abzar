/** ایران از ۱۴۰۱ ساعت تابستانی ندارد؛ آفست ثابت +۰۳:۳۰ است. */
const TEHRAN_OFFSET_MS = 210 * 60_000;

/** شروع روز (۰۰:۰۰ به وقت تهران) به‌صورت Date (UTC). `daysAgo` برای روزهای قبل. */
export function startOfTehranDay(now = new Date(), daysAgo = 0): Date {
  const shifted = new Date(now.getTime() + TEHRAN_OFFSET_MS);
  shifted.setUTCHours(0, 0, 0, 0);
  shifted.setUTCDate(shifted.getUTCDate() - daysAgo);

  return new Date(shifted.getTime() - TEHRAN_OFFSET_MS);
}
