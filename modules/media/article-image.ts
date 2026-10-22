import "server-only";
import { randomUUID } from "node:crypto";
import { storage } from "@/lib/storage";
import { MAX_FILE_BYTES } from "./constants";
import { processImage } from "./process";

export type ArticleImageResult = { ok: true; url: string } | { ok: false; error: string };

/** آپلود یک تصویر برای متن/تصویر شاخص مقاله (همان پردازش sharp → WebP، بدون EXIF). */
export async function addArticleImage(file: File): Promise<ArticleImageResult> {
  if (file.size === 0) return { ok: false, error: "فایلی انتخاب نشده است." };
  if (file.size > MAX_FILE_BYTES) return { ok: false, error: "حجم تصویر بیشتر از ۸ مگابایت است." };

  const processed = await processImage(Buffer.from(await file.arrayBuffer()));
  if (!processed) return { ok: false, error: "تصویر معتبر (JPG/PNG/WebP) نیست." };

  const url = await storage.put(`articles/${randomUUID()}.webp`, processed.data, "image/webp");
  return { ok: true, url };
}
