export const PRODUCT_SORTS = ["newest", "price-asc", "price-desc", "discount", "rating"] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export const DEFAULT_SORT: ProductSort = "newest";

export const PRODUCT_SORT_LABELS: Record<ProductSort, string> = {
  newest: "جدیدترین",
  "price-asc": "ارزان‌ترین",
  "price-desc": "گران‌ترین",
  discount: "بیشترین تخفیف",
  rating: "بیشترین امتیاز",
};

/** برای دمو عدد کوچک است تا صفحه‌بندی دیده شود؛ در production به ۲۴ افزایش یابد. */
export const PAGE_SIZE = 8;
