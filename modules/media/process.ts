import "server-only";
import sharp from "sharp";
import { ALLOWED_FORMATS, MAX_DIMENSION, MAX_INPUT_PIXELS, WEBP_QUALITY } from "./constants";

export type ProcessedImage = { data: Buffer; width: number; height: number };

/**
 * نوع فایل از محتوای واقعی (magic bytes، توسط libvips) تشخیص داده می‌شود نه پسوند/Content-Type کلاینت.
 * خروجی همیشه WebP تازه‌کدشده است: متادیتا (EXIF/GPS) حذف و جهت تصویر اعمال می‌شود.
 * فایل نامعتبر/غیرتصویر/خیلی بزرگ → `null`.
 */
export async function processImage(input: Buffer): Promise<ProcessedImage | null> {
  try {
    const image = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, failOn: "error" });
    const meta = await image.metadata();
    if (!meta.format || !ALLOWED_FORMATS.includes(meta.format)) return null;

    const { data, info } = await image
      .rotate()
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer({ resolveWithObject: true });

    return { data, width: info.width, height: info.height };
  } catch {
    return null;
  }
}
