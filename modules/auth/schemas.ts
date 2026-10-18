import { z } from "zod";
import { toLatinDigits, normalizeIranMobile } from "@/lib/phone";
import { OTP_LENGTH } from "./constants";

export const phoneSchema = z
  .string()
  .max(30)
  .transform((value, ctx) => {
    const phone = normalizeIranMobile(value);
    if (!phone) {
      ctx.addIssue({ code: "custom", message: "شماره موبایل معتبر نیست" });
      return z.NEVER;
    }
    return phone;
  });

export const requestOtpSchema = z.object({ phone: phoneSchema });

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: z
    .string()
    .max(12)
    .transform(toLatinDigits)
    .pipe(z.string().regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), `کد ${OTP_LENGTH} رقمی را وارد کنید`)),
  next: z.string().max(200).optional(),
});

export const adminLoginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "رمز را وارد کنید").max(200),
});
