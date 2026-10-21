export const SETTING_KEYS = { shipping: "shipping" } as const;

/** مبالغ به تومان. زیر `freeOver` هزینه‌ی ثابت `flatCost` گرفته می‌شود؛ `freeOver = 0` یعنی ارسال همیشه رایگان. */
export type ShippingSettings = { flatCost: number; freeOver: number };

/** مقدار پیش‌فرض تا ادمین در /admin/settings تنظیم کند (نمونه؛ صاحب فروشگاه مشخص می‌کند). */
export const DEFAULT_SHIPPING: ShippingSettings = { flatCost: 80_000, freeOver: 5_000_000 };
