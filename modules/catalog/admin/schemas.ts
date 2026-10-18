import { z } from "zod";
import { toLatinDigits } from "@/lib/phone";

const MAX_PRICE = 2_000_000_000;

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "نامک (slug) را وارد کنید")
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "نامک فقط شامل حروف لاتین کوچک، عدد و خط تیره باشد");

const idSchema = z.string().min(1, "انتخاب کنید").max(40);

/** رشته‌ی عددی با ارقام فارسی/کاما → عدد صحیح. */
function numberFromText(value: string): number {
  const cleaned = toLatinDigits(value).replace(/[,٬\s]/g, "");
  return cleaned === "" ? Number.NaN : Number(cleaned);
}

const priceSchema = z
  .string()
  .transform(numberFromText)
  .pipe(z.number({ error: "قیمت را به عدد وارد کنید" }).int().min(1, "قیمت باید مثبت باشد").max(MAX_PRICE));

const optionalPriceSchema = z
  .string()
  .transform((value) => (value.trim() === "" ? null : numberFromText(value)))
  .pipe(z.number({ error: "قیمت قبل از تخفیف نامعتبر است" }).int().min(1).max(MAX_PRICE).nullable());

const intSchema = (label: string, min: number, max: number) =>
  z
    .string()
    .transform(numberFromText)
    .pipe(z.number({ error: `${label} را به عدد وارد کنید` }).int().min(min, `${label} نامعتبر است`).max(max, `${label} نامعتبر است`));

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `حداکثر ${max} کاراکتر`)
    .transform((value) => value || null);

/** هر خط «برچسب: مقدار». خط بدون «:» خطا می‌دهد تا مشخصات بی‌صدا گم نشوند. */
const specsSchema = z
  .string()
  .max(5000)
  .transform((text, ctx) => {
    const specs: { label: string; value: string }[] = [];

    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const index = trimmed.search(/[:：]/);
      const label = index > 0 ? trimmed.slice(0, index).trim() : "";
      const value = index > 0 ? trimmed.slice(index + 1).trim() : "";
      if (!label || !value) {
        ctx.addIssue({ code: "custom", message: `مشخصات: خط «${trimmed.slice(0, 30)}» باید به شکل «برچسب: مقدار» باشد` });
        return z.NEVER;
      }
      specs.push({ label: label.slice(0, 80), value: value.slice(0, 300) });
    }

    if (specs.length > 40) {
      ctx.addIssue({ code: "custom", message: "حداکثر ۴۰ مشخصه مجاز است" });
      return z.NEVER;
    }
    return specs;
  });

const productBase = z.object({
  name: z.string().trim().min(3, "نام محصول را وارد کنید").max(160),
  sku: z
    .string()
    .trim()
    .min(2, "کد کالا (SKU) را وارد کنید")
    .max(40)
    .regex(/^[A-Za-z0-9._-]+$/, "SKU فقط حروف لاتین، عدد و . _ - باشد"),
  slug: slugSchema,
  brandId: idSchema,
  categoryId: idSchema,
  shortDescription: z.string().trim().min(10, "توضیح کوتاه حداقل ۱۰ کاراکتر باشد").max(300),
  description: z.string().trim().min(10, "توضیحات حداقل ۱۰ کاراکتر باشد").max(20_000),
  price: priceSchema,
  compareAtPrice: optionalPriceSchema,
  lowStockThreshold: intSchema("آستانه‌ی کمبود", 0, 1000),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"], { error: "وضعیت نامعتبر است" }),
  specs: specsSchema,
  seoTitle: optionalText(70),
  seoDescription: optionalText(160),
});

type ProductBase = z.output<typeof productBase>;

function checkCompareAt(value: ProductBase, ctx: z.RefinementCtx) {
  if (value.compareAtPrice !== null && value.compareAtPrice <= value.price) {
    ctx.addIssue({ code: "custom", path: ["compareAtPrice"], message: "قیمت قبل از تخفیف باید از قیمت نهایی بیشتر باشد" });
  }
}

export const productUpdateSchema = productBase.superRefine(checkCompareAt);

/** موجودی اولیه فقط هنگام ساخت؛ بعد از آن فقط از صفحه‌ی «انبار» (با ثبت دلیل). */
export const productCreateSchema = productBase
  .extend({ initialStock: intSchema("موجودی اولیه", 0, 1_000_000) })
  .superRefine(checkCompareAt);

export const categorySchema = z.object({
  name: z.string().trim().min(2, "نام دسته را وارد کنید").max(80),
  slug: slugSchema,
  parentId: z
    .string()
    .max(40)
    .transform((value) => value || null),
  description: optionalText(500),
  sortOrder: intSchema("ترتیب", 0, 10_000),
  isActive: z.boolean(),
  seoTitle: optionalText(70),
  seoDescription: optionalText(160),
});

export const brandSchema = z.object({
  name: z.string().trim().min(1, "نام برند را وارد کنید").max(60),
  slug: slugSchema,
});

export const entityIdSchema = z.string().min(1).max(40);
