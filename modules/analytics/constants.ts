/** ثابت‌های آنالیتیکس (خالص؛ بدون وابستگی به سرور تا در تست و کلاینت قابل‌استفاده باشد). */

export const PAGE_KINDS = [
  "HOME",
  "PRODUCTS",
  "PRODUCT",
  "CATEGORY",
  "BLOG",
  "ARTICLE",
  "CART",
  "CHECKOUT",
  "ACCOUNT",
  "LOGIN",
  "OTHER",
] as const;
export type PageKind = (typeof PAGE_KINDS)[number];

export const TRAFFIC_SOURCES = [
  "DIRECT",
  "SEARCH",
  "TELEGRAM",
  "INSTAGRAM",
  "WHATSAPP",
  "MESSENGER",
  "SOCIAL",
  "REFERRAL",
  "INTERNAL",
] as const;
export type TrafficSource = (typeof TRAFFIC_SOURCES)[number];

export const DEVICES = ["MOBILE", "TABLET", "DESKTOP"] as const;
export type Device = (typeof DEVICES)[number];

export const SOURCE_LABELS: Record<TrafficSource, string> = {
  DIRECT: "مستقیم / نامشخص",
  SEARCH: "موتور جستجو",
  TELEGRAM: "تلگرام",
  INSTAGRAM: "اینستاگرام",
  WHATSAPP: "واتساپ",
  MESSENGER: "پیام‌رسان‌های داخلی (ایتا، روبیکا، بله…)",
  SOCIAL: "شبکه‌های اجتماعی دیگر",
  REFERRAL: "سایت‌های دیگر",
  INTERNAL: "بازگشت از داخل سایت",
};

export const KIND_LABELS: Record<PageKind, string> = {
  HOME: "صفحه‌ی اصلی",
  PRODUCTS: "لیست محصولات",
  PRODUCT: "صفحه‌ی محصول",
  CATEGORY: "دسته‌بندی",
  BLOG: "لیست مقالات",
  ARTICLE: "مقاله",
  CART: "سبد خرید",
  CHECKOUT: "تسویه‌حساب",
  ACCOUNT: "حساب کاربری",
  LOGIN: "ورود / ثبت‌نام",
  OTHER: "سایر",
};

export const DEVICE_LABELS: Record<Device, string> = {
  MOBILE: "موبایل",
  TABLET: "تبلت",
  DESKTOP: "دسکتاپ",
};

/** کوکی بازدیدکننده ۱۸۰ روز، نشست ۳۰ دقیقه (تمدید با هر رویداد). */
export const VISITOR_COOKIE_SECONDS = 180 * 24 * 60 * 60;
export const SESSION_COOKIE_SECONDS = 30 * 60;

/** رویدادهای قدیمی‌تر از این در کرون پاک می‌شوند. */
export const ANALYTICS_RETENTION_DAYS = 180;
