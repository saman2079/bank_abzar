import { z } from "zod";
import { normalizeIranMobile, toLatinDigits } from "@/lib/phone";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "./constants";

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

/** رمزهای بدیهی که نباید پذیرفته شوند (فهرست کوتاه؛ طول و تکرار جداگانه چک می‌شود). */
const COMMON_PASSWORDS = new Set([
  "12345678",
  "123456789",
  "1234567890",
  "11111111",
  "00000000",
  "87654321",
  "password",
  "password1",
  "qwertyui",
  "qwertyuiop",
  "iloveyou",
  "abc12345",
  "a1234567",
]);

export const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `رمز عبور حداقل ${PASSWORD_MIN_LENGTH} کاراکتر باشد`)
  .max(PASSWORD_MAX_LENGTH, `رمز عبور حداکثر ${PASSWORD_MAX_LENGTH} کاراکتر باشد`)
  .refine((value) => !COMMON_PASSWORDS.has(value.toLowerCase()), "این رمز بسیار رایج است؛ رمز دیگری انتخاب کنید")
  .refine((value) => new Set(value).size > 2, "رمز عبور نباید تکرار یک یا دو کاراکتر باشد");

const nextSchema = z.string().max(200).optional();

export const registerSchema = z
  .object({
    phone: phoneSchema,
    password: newPasswordSchema,
    confirm: z.string().max(PASSWORD_MAX_LENGTH + 100),
    next: nextSchema,
  })
  .refine((value) => value.password === value.confirm, { path: ["confirm"], message: "تکرار رمز عبور یکسان نیست" })
  .refine((value) => toLatinDigits(value.password) !== value.phone, {
    path: ["password"],
    message: "رمز عبور نباید همان شماره موبایل باشد",
  });

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "رمز عبور را وارد کنید").max(200),
  next: nextSchema,
});

export const adminLoginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "رمز را وارد کنید").max(200),
});
