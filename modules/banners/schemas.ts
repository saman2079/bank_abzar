import { z } from "zod";
import { toLatinDigits } from "@/lib/phone";

const optionalText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, `${label} حداکثر ${max} نویسه است`)
    .transform((value) => (value === "" ? null : value));

/** لینک: مسیر داخلی (`/products`) یا آدرس https؛ `//evil.com` و `javascript:` رد می‌شود. */
const linkField = z
  .string()
  .trim()
  .max(300, "لینک خیلی بلند است")
  .refine(
    (value) => {
      if (value === "") return true;
      if (value.startsWith("/")) return !value.startsWith("//") && !value.includes("\\");
      try {
        return new URL(value).protocol === "https:";
      } catch {
        return false;
      }
    },
    "لینک باید با / (مسیر داخلی) یا https:// شروع شود",
  )
  .transform((value) => (value === "" ? null : value));

/** آدرس تصویر آپلودشده توسط خود سایت (یا Blob)؛ آدرس دلخواه بیرونی پذیرفته نمی‌شود. */
const imageField = z
  .string()
  .trim()
  .max(500)
  .refine(
    (value) =>
      value === "" ||
      (value.startsWith("/uploads/") && !value.includes("..")) ||
      /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//.test(value),
    "آدرس تصویر نامعتبر است",
  )
  .transform((value) => (value === "" ? null : value));

/** تاریخ از `datetime-local` (بدون منطقه؛ به وقت تهران) → Date یا null. */
const dateField = (label: string) =>
  z
    .string()
    .trim()
    .transform((value, ctx) => {
      if (value === "") return null;
      const normalized = toLatinDigits(value);
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) {
        ctx.addIssue({ code: "custom", message: `${label} نامعتبر است` });
        return z.NEVER;
      }
      const date = new Date(`${normalized}:00+03:30`);
      if (Number.isNaN(date.getTime())) {
        ctx.addIssue({ code: "custom", message: `${label} نامعتبر است` });
        return z.NEVER;
      }
      return date;
    });

export const bannerSchema = z
  .object({
    title: z.string().trim().min(2, "عنوان بنر را وارد کنید").max(80, "عنوان حداکثر ۸۰ نویسه است"),
    subtitle: optionalText("زیرعنوان", 160),
    ctaLabel: optionalText("متن دکمه", 30),
    linkUrl: linkField,
    imageUrl: imageField,
    mobileImageUrl: imageField,
    imageAlt: optionalText("متن جایگزین تصویر", 160),
    isActive: z.boolean(),
    startsAt: dateField("زمان شروع"),
    endsAt: dateField("زمان پایان"),
  })
  .refine((v) => !(v.startsAt && v.endsAt) || v.endsAt > v.startsAt, {
    message: "زمان پایان باید بعد از زمان شروع باشد",
    path: ["endsAt"],
  })
  .refine((v) => !v.ctaLabel || v.linkUrl, {
    message: "برای دکمه، لینک را هم وارد کنید",
    path: ["linkUrl"],
  });

export type BannerInput = z.infer<typeof bannerSchema>;

export const bannerIdSchema = z.string().min(1).max(40);
