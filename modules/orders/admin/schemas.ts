import { z } from "zod";
import { phoneSchema } from "@/modules/auth/schemas";
import { tomanField } from "@/modules/settings/schemas";
import { addressSchema, profileSchema } from "@/modules/users/schemas";
import { ORDER_STATUSES } from "../constants";

export const changeStatusSchema = z.object({
  orderId: z.string().min(1).max(40),
  to: z.enum(ORDER_STATUSES, { error: "وضعیت جدید را انتخاب کنید" }),
  note: z
    .string()
    .trim()
    .max(300, "حداکثر ۳۰۰ کاراکتر")
    .transform((value) => value || null),
  restock: z.boolean(),
});

const optionalText = z
  .string()
  .trim()
  .max(300, "حداکثر ۳۰۰ کاراکتر")
  .transform((value) => value || null);

/** ثبت سفارش دستی توسط ادمین/کارمند برای مشتری تلفنی/حضوری. */
export const manualOrderSchema = z.object({
  phone: phoneSchema,
  customerName: profileSchema.shape.name,
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(40),
        quantity: z
          .number({ error: "تعداد نامعتبر است" })
          .int("تعداد نامعتبر است")
          .min(1, "تعداد باید حداقل ۱ باشد")
          .max(999, "تعداد بیش از حد زیاد است"),
      }),
    )
    .min(1, "حداقل یک کالا اضافه کنید")
    .max(50, "حداکثر ۵۰ ردیف کالا"),
  address: addressSchema.omit({ isDefault: true }),
  paid: z.boolean(),
  paymentNote: optionalText,
  note: optionalText,
  /** خالی = محاسبه‌ی خودکار از تنظیمات؛ مقدار = جایگزین (مثلاً تحویل حضوری ۰) */
  shippingCost: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .pipe(z.union([z.null(), tomanField("هزینه‌ی ارسال")])),
});

export type ManualOrderInput = z.output<typeof manualOrderSchema>;
