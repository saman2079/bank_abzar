import { z } from "zod";
import { toLatinDigits } from "@/lib/phone";
import { phoneSchema } from "@/modules/auth/schemas";
import { PROVINCES } from "./constants";

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .max(80, "نام بیش از حد طولانی است")
    .refine((value) => value === "" || value.length >= 2, "نام بسیار کوتاه است")
    .transform((value) => value || null),
  email: z
    .string()
    .trim()
    .max(120)
    .refine((value) => value === "" || z.email().safeParse(value).success, "ایمیل معتبر نیست")
    .transform((value) => value || null),
});

export const addressSchema = z.object({
  receiverName: z.string().trim().min(2, "نام گیرنده را وارد کنید").max(80),
  receiverPhone: phoneSchema,
  province: z.enum(PROVINCES, { error: "استان را انتخاب کنید" }),
  city: z.string().trim().min(2, "شهر را وارد کنید").max(60),
  postalCode: z
    .string()
    .transform(toLatinDigits)
    .pipe(z.string().regex(/^\d{10}$/, "کدپستی باید ۱۰ رقم باشد")),
  street: z.string().trim().min(5, "نشانی را کامل وارد کنید").max(250),
  plaque: z.string().trim().min(1, "پلاک را وارد کنید").max(10),
  unit: z
    .string()
    .trim()
    .max(10)
    .transform((value) => value || null),
  isDefault: z.boolean(),
});

export const idSchema = z.string().min(1).max(40);
