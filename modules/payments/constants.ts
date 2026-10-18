/** با شروع پرداخت، مهلت سفارش حداقل تا این مدت تمدید می‌شود (اعتبار authority زرین‌پال ~۱۵ دقیقه). */
export const PAYMENT_HOLD_MINUTES = 20;
export const MAX_PAYMENT_ATTEMPTS_PER_ORDER = 5;
/** کرون فقط پرداخت‌های PENDING قدیمی‌تر از این را بازبینی می‌کند (کاربر ممکن است هنوز در درگاه باشد). */
export const RECONCILE_AFTER_MINUTES = 20;
export const RECONCILE_WINDOW_HOURS = 72;
