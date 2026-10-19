import type { ActionState } from "@/lib/form";

/** نتیجه‌ی ساخت محصول؛ `productId` برای آپلود تصاویر و ریدایرکت سمت کلاینت. */
export type CreateProductState = ActionState & { productId?: string };
