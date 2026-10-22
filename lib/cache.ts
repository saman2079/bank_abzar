/**
 * تگ‌های کش (`cacheTag`). بعد از هر تغییر در پنل ادمین، تگ مربوط بی‌اعتبار می‌شود:
 * - داخل Server Action:  `updateTag(tag)`           (کاربر تغییر خودش را فوری می‌بیند)
 * - داخل Route Handler:  `revalidateTag(tag, "max")` (آرگومان دوم در Next 16 اجباری است)
 */
export const CACHE_TAGS = {
  /** همه‌ی لیست‌ها: صفحه‌ی فروشگاه، دسته‌ها، محصولات ویژه، مرتبط */
  catalog: "catalog",
  categories: "categories",
  brands: "brands",
  settings: "settings",
  articles: "articles",
  article: (slug: string) => `article:${slug}`,
  product: (slug: string) => `product:${slug}`,
} as const;
