/**
 * یکسان‌سازی حروف عربی (ي/ك) به فارسی (ی/ک) برای جستجو.
 * نیم‌فاصله عمداً دست‌نخورده می‌ماند چون در نام محصولات ذخیره‌شده است.
 */
export function normalizePersianChars(value: string): string {
  return value.replaceAll("ي", "ی").replaceAll("ك", "ک").trim();
}
