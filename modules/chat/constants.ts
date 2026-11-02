export const MAX_MESSAGE_LENGTH = 1000;
export const MAX_NAME_LENGTH = 40;
/** حداکثر پیام در هر گفتگو (جلوگیری از پر شدن دیتابیس با اسپم) */
export const MAX_MESSAGES_PER_CONVERSATION = 500;
/** گفتگوهای قدیمی‌تر از این تعداد روز (از آخرین پیام) توسط کرون پاک می‌شوند */
export const CHAT_RETENTION_DAYS = 90;
/** حداکثر پیام برگردانده‌شده در هر poll */
export const POLL_BATCH = 100;

export const CHAT_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
