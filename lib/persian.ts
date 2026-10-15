const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

export function toEnglishDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)));
}

export function normalizePersianSearch(value: string): string {
  return toEnglishDigits(value)
    .normalize("NFKC")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[\u200c\s]+/g, " ")
    .trim()
    .toLocaleLowerCase("fa-IR");
}

export function normalizeIranianMobile(value: string): string | null {
  const digits = toEnglishDigits(value).replace(/[\s()-]/g, "");
  const normalized = digits.startsWith("+98")
    ? `0${digits.slice(3)}`
    : digits.startsWith("0098")
      ? `0${digits.slice(4)}`
      : digits;
  return /^09\d{9}$/.test(normalized) ? normalized : null;
}
