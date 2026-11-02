import { z } from "zod";
import { MAX_MESSAGE_LENGTH, MAX_NAME_LENGTH } from "./constants";

/** متن پیام: فقط متن ساده؛ فاصله‌های اضافه و نویسه‌های کنترلی حذف می‌شود. */
const messageBody = z
  .string()
  // حذف عمدی نویسه‌های کنترلی (به‌جز خط جدید)
  .transform((value) => value.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "").trim())
  .pipe(z.string().min(1, "پیام خالی است").max(MAX_MESSAGE_LENGTH, `پیام حداکثر ${MAX_MESSAGE_LENGTH} نویسه است`));

export const visitorMessageSchema = z.object({
  body: messageBody,
  name: z
    .string()
    .trim()
    .max(MAX_NAME_LENGTH)
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export const staffMessageSchema = z.object({ body: messageBody });

/** cursor = `seq` آخرین پیام دریافت‌شده (۰ = از اول) */
export const cursorSchema = z.coerce.number().int().min(0).max(2_000_000_000).catch(0);
