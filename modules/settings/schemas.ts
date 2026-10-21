import { z } from "zod";
import { toLatinDigits } from "@/lib/phone";

/** مبلغ تومان از فرم: ارقام فارسی و جداکننده‌ی هزارگان مجاز است. */
export function tomanField(label: string) {
  return z
    .string()
    .transform((value) => toLatinDigits(value).replace(/[,٬\s]/g, ""))
    .pipe(z.string().regex(/^\d{1,10}$/, `${label} نامعتبر است`))
    .transform(Number)
    .pipe(z.number().int().max(1_000_000_000, `${label} بیش از حد بزرگ است`));
}

export const shippingFormSchema = z.object({
  flatCost: tomanField("هزینه‌ی ارسال"),
  freeOver: tomanField("حد ارسال رایگان"),
});

/** شکل ذخیره‌شده در DB (برای parse امن خروجی). */
export const storedShippingSchema = z.object({
  flatCost: z.number().int().min(0),
  freeOver: z.number().int().min(0),
});
