export const MAX_IMAGES_PER_PRODUCT = 10;
export const MAX_FILES_PER_REQUEST = 10;
/** حداکثر حجم هر فایل ورودی (قبل از تبدیل به WebP) */
export const MAX_FILE_BYTES = 8 * 1024 * 1024;
export const MAX_REQUEST_BYTES = 40 * 1024 * 1024;
/** ورودی بزرگ‌تر از این تعداد پیکسل رد می‌شود (جلوگیری از decompression bomb) */
export const MAX_INPUT_PIXELS = 40_000_000;
export const MAX_DIMENSION = 1600;
export const WEBP_QUALITY = 82;
export const ALLOWED_FORMATS: readonly string[] = ["jpeg", "png", "webp"];
export const ACCEPT_ATTRIBUTE = "image/jpeg,image/png,image/webp";
export const ALT_MIN = 2;
export const ALT_MAX = 160;
