export const ARTICLE_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

export const ARTICLE_STATUS_LABELS: Record<ArticleStatus, string> = {
  DRAFT: "پیش‌نویس",
  PUBLISHED: "منتشرشده",
  ARCHIVED: "بایگانی",
};

/** سقف حجم HTML خام ارسالی از ادیتور (کاراکتر) */
export const ARTICLE_HTML_MAX = 300_000;
/** برای انتشار، متن مقاله حداقل این‌قدر کاراکتر (بدون تگ) باشد */
export const ARTICLE_MIN_TEXT_TO_PUBLISH = 100;
