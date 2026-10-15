import { normalizeIranianMobile, normalizePersianSearch } from "@/lib/persian";

export function requireIranianMobile(input: unknown): string {
  if (typeof input !== "string") {
    throw new Error("شماره موبایل الزامی است.");
  }
  const normalized = normalizeIranianMobile(input);
  if (!normalized) {
    throw new Error("شماره موبایل باید معتبر و به فرمت ۰۹xxxxxxxxx باشد.");
  }
  return normalized;
}

export function requirePositiveInteger(
  input: unknown,
  options: { min?: number; max?: number; label?: string } = {},
): number {
  const min = options.min ?? 1;
  const max = options.max ?? 99;
  const label = options.label ?? "مقدار";
  if (typeof input !== "number" || !Number.isSafeInteger(input) || input < min || input > max) {
    throw new Error(`${label} باید عدد صحیح بین ${min} و ${max} باشد.`);
  }
  return input;
}

export function normalizeSearchInput(input: unknown): string {
  if (typeof input !== "string") return "";
  return normalizePersianSearch(input).slice(0, 120);
}

export function requireSlug(input: unknown): string {
  if (typeof input !== "string") {
    throw new Error("شناسه متنی معتبر نیست.");
  }
  const slug = input.trim().toLowerCase();
  if (slug.length < 2 || slug.length > 160 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("شناسه باید از حروف انگلیسی، اعداد و خط تیره تشکیل شود.");
  }
  return slug;
}

export function requirePlainText(input: unknown, label: string, maxLength: number): string {
  if (typeof input !== "string") {
    throw new Error(`${label} الزامی است.`);
  }
  const value = input.trim();
  if (value.length === 0 || value.length > maxLength) {
    throw new Error(`${label} باید بین ۱ تا ${maxLength} نویسه باشد.`);
  }
  return value;
}
