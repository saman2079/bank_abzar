import { z } from "zod";
import { DEFAULT_SORT, PRODUCT_SORTS } from "./constants";

/** هر مقدار نامعتبر به مقدار پیش‌فرض برمی‌گردد؛ ورودی کاربر هرگز خطا پرتاب نمی‌کند. */
export const productListQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((value) => value || undefined)
    .catch(undefined),
  category: z
    .string()
    .regex(/^[a-z0-9-]{1,60}$/)
    .optional()
    .catch(undefined),
  brand: z
    .string()
    .trim()
    .max(60)
    .optional()
    .transform((value) => value || undefined)
    .catch(undefined),
  sort: z.enum(PRODUCT_SORTS).catch(DEFAULT_SORT),
  page: z.coerce.number().int().min(1).max(1000).catch(1),
});

export type ProductListQuery = z.output<typeof productListQuerySchema>;

/** ستون Json مشخصات فنی در دیتابیس؛ مقدار خراب به [] تبدیل می‌شود تا صفحه نشکند. */
export const productSpecsSchema = z.array(z.object({ label: z.string(), value: z.string() }));
