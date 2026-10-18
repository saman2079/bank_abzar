const DIGITS_FA = "۰۱۲۳۴۵۶۷۸۹";
const DIGITS_AR = "٠١٢٣٤٥٦٧٨٩";

/** ارقام فارسی/عربی را به لاتین تبدیل می‌کند. */
export function toLatinDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, (char) => {
    const fa = DIGITS_FA.indexOf(char);
    return String(fa >= 0 ? fa : DIGITS_AR.indexOf(char));
  });
}

/**
 * شماره‌ی موبایل ایران را به قالب استاندارد `09xxxxxxxxx` برمی‌گرداند؛ نامعتبر → null.
 * قالب‌های پذیرفته: 09123456789، 9123456789، +989123456789، 989123456789، 00989123456789.
 */
export function normalizeIranMobile(input: string): string | null {
  const digits = toLatinDigits(input).replace(/[\s\-()]/g, "");
  const match = /^(?:\+?98|0098|0)?(9\d{9})$/.exec(digits);

  return match ? `0${match[1]}` : null;
}

/** برای لاگ/نمایش: 0912***6789 */
export function maskPhone(phone: string): string {
  return phone.length === 11 ? `${phone.slice(0, 4)}***${phone.slice(7)}` : "***";
}