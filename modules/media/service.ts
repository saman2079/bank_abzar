import "server-only";
import { randomUUID } from "node:crypto";
import { writeAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/session";
import { storage } from "@/lib/storage";
import { MAX_FILES_PER_REQUEST, MAX_FILE_BYTES, MAX_IMAGES_PER_PRODUCT } from "./constants";
import { processImage, type ProcessedImage } from "./process";

export type MediaResult<T> = { ok: true; data: T } | { ok: false; error: string };
export type StoredImage = { id: string; url: string; alt: string };

/** افزودن تصویر(ها) به محصول. فایل‌ها اول همه پردازش می‌شوند؛ اگر یکی نامعتبر بود هیچ‌کدام ذخیره نمی‌شود. */
export async function addProductImages(
  actor: SessionUser,
  productId: string,
  files: File[],
): Promise<MediaResult<{ slug: string; images: StoredImage[] }>> {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, slug: true, _count: { select: { images: true } } },
  });
  if (!product) return { ok: false, error: "محصول پیدا نشد." };

  if (files.length === 0) return { ok: false, error: "فایلی انتخاب نشده است." };
  if (files.length > MAX_FILES_PER_REQUEST) return { ok: false, error: `حداکثر ${MAX_FILES_PER_REQUEST} تصویر در هر بار آپلود.` };
  if (product._count.images + files.length > MAX_IMAGES_PER_PRODUCT) {
    return { ok: false, error: `هر محصول حداکثر ${MAX_IMAGES_PER_PRODUCT} تصویر دارد.` };
  }

  const processed: ProcessedImage[] = [];
  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) return { ok: false, error: `حجم «${file.name}» بیشتر از ۸ مگابایت است.` };

    const result = await processImage(Buffer.from(await file.arrayBuffer()));
    if (!result) return { ok: false, error: `«${file.name}» تصویر معتبر (JPG/PNG/WebP) نیست.` };
    processed.push(result);
  }

  const last = await db.productImage.aggregate({ where: { productId }, _max: { sortOrder: true } });
  let sortOrder = (last._max.sortOrder ?? -1) + 1;
  const alt = product.name.slice(0, 160);
  const stored: StoredImage[] = [];

  try {
    for (const image of processed) {
      const url = await storage.put(`products/${product.id}/${randomUUID()}.webp`, image.data, "image/webp");
      try {
        stored.push(
          await db.productImage.create({
            data: { productId, url, alt, sortOrder: sortOrder++ },
            select: { id: true, url: true, alt: true },
          }),
        );
      } catch (error) {
        await storage.remove(url).catch(() => undefined);
        throw error;
      }
    }
  } catch {
    // برگرداندن کامل: فایل‌ها و ردیف‌هایی که در همین درخواست ساخته شده‌اند.
    await Promise.all(
      stored.map(async (item) => {
        await db.productImage.delete({ where: { id: item.id } }).catch(() => undefined);
        await storage.remove(item.url).catch(() => undefined);
      }),
    );
    return { ok: false, error: "ذخیره‌ی تصویر ناموفق بود؛ دوباره تلاش کنید." };
  }

  await writeAudit({
    actor,
    action: "product.image.add",
    entity: "product",
    entityId: product.id,
    diff: { count: stored.length },
  });

  return { ok: true, data: { slug: product.slug, images: stored } };
}

async function findImage(imageId: string) {
  return db.productImage.findUnique({
    where: { id: imageId },
    select: { id: true, url: true, productId: true, product: { select: { slug: true } } },
  });
}

export async function updateImageAlt(actor: SessionUser, imageId: string, alt: string): Promise<MediaResult<{ slug: string }>> {
  const image = await findImage(imageId);
  if (!image) return { ok: false, error: "تصویر پیدا نشد." };

  await db.productImage.update({ where: { id: image.id }, data: { alt } });
  await writeAudit({ actor, action: "product.image.alt", entity: "product", entityId: image.productId, diff: { imageId, alt } });

  return { ok: true, data: { slug: image.product.slug } };
}

export async function deleteProductImage(actor: SessionUser, imageId: string): Promise<MediaResult<{ slug: string }>> {
  const image = await findImage(imageId);
  if (!image) return { ok: false, error: "تصویر پیدا نشد." };

  await db.productImage.delete({ where: { id: image.id } });
  await writeAudit({ actor, action: "product.image.delete", entity: "product", entityId: image.productId, diff: { imageId } });
  // اگر حذف فایل شکست بخورد فقط یک فایل یتیم می‌ماند؛ ردیف DB (منبع حقیقت) پاک شده است.
  await storage.remove(image.url).catch(() => undefined);

  return { ok: true, data: { slug: image.product.slug } };
}

/** جابه‌جایی با تصویر مجاور؛ ترتیب همه‌ی تصاویر محصول بازنویسی می‌شود (۰..n) تا تکراری نماند. اولی = تصویر اصلی. */
export async function moveProductImage(
  actor: SessionUser,
  imageId: string,
  direction: "earlier" | "later",
): Promise<MediaResult<{ slug: string }>> {
  const image = await findImage(imageId);
  if (!image) return { ok: false, error: "تصویر پیدا نشد." };

  await db.$transaction(async (tx) => {
    const all = await tx.productImage.findMany({
      where: { productId: image.productId },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: { id: true },
    });
    const from = all.findIndex((item) => item.id === image.id);
    const to = direction === "earlier" ? from - 1 : from + 1;
    const moved = all[from];
    const other = all[to];
    if (from < 0 || !moved || !other) return;

    all[from] = other;
    all[to] = moved;
    await Promise.all(all.map((item, index) => tx.productImage.update({ where: { id: item.id }, data: { sortOrder: index } })));
  });

  await writeAudit({ actor, action: "product.image.move", entity: "product", entityId: image.productId, diff: { imageId, direction } });

  return { ok: true, data: { slug: image.product.slug } };
}
