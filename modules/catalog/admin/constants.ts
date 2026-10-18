export const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
export type AdminProductStatus = (typeof PRODUCT_STATUSES)[number];

export const PRODUCT_STATUS_LABELS: Record<AdminProductStatus, string> = {
  DRAFT: "پیش‌نویس",
  ACTIVE: "فعال (قابل مشاهده)",
  ARCHIVED: "بایگانی",
};
