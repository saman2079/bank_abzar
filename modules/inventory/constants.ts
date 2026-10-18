export const STOCK_MOVEMENT_LABELS = {
  SALE: "فروش آنلاین",
  ORDER_CANCEL: "لغو سفارش",
  MANUAL_IN: "ورود کالا (دستی)",
  MANUAL_OUT: "خروج کالا (دستی/فروش حضوری)",
  ADJUSTMENT: "اصلاح موجودی (شمارش)",
  RETURN: "مرجوعی",
  INITIAL: "موجودی اولیه",
} as const;

export const ADJUST_MODES = ["IN", "OUT", "SET"] as const;
export type AdjustMode = (typeof ADJUST_MODES)[number];

export const ADJUST_MODE_LABELS: Record<AdjustMode, string> = {
  IN: "افزایش (ورود کالا)",
  OUT: "کاهش (فروش حضوری/خروج)",
  SET: "تنظیم روی مقدار مشخص (شمارش انبار)",
};
