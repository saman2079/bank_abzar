import "server-only";
import { z } from "zod";

/**
 * تنها نقطه‌ی خواندن متغیرهای محیطی.
 * هیچ‌جای پروژه مستقیم از process.env نخوان؛ از `env` استفاده کن.
 */
const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),

    // فاز ۲
    DATABASE_URL: z.string().min(1),

    // فاز ۳
    SESSION_SECRET: z.string().min(32),
    SMS_PROVIDER: z.enum(["console", "kavenegar"]).default("console"),
    SMS_API_KEY: z.string().min(1).optional(),
    SMS_SENDER: z.string().min(1).optional(),

    // فاز ۵
    ZARINPAL_MERCHANT_ID: z.string().length(36).optional(),

    // فاز ۴
    CRON_SECRET: z.string().min(16).optional(),

    // فاز ۶B
    STORAGE_DRIVER: z.enum(["local", "blob"]).default("local"),
    UPLOAD_DIR: z.string().min(1).default("uploads"),
    BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.SMS_PROVIDER === "kavenegar" && !value.SMS_API_KEY) {
      ctx.addIssue({
        code: "custom",
        path: ["SMS_API_KEY"],
        message: "required",
      });
    }

    if (value.STORAGE_DRIVER === "blob" && !value.BLOB_READ_WRITE_TOKEN) {
      ctx.addIssue({
        code: "custom",
        path: ["BLOB_READ_WRITE_TOKEN"],
        message: "required",
      });
    }
  });

// خط خالی در .env یعنی «تنظیم نشده».
const rawEnv = Object.fromEntries(
  Object.entries(process.env).filter(([, value]) => value !== ""),
);

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  const fields = Object.keys(
    z.flattenError(parsed.error).fieldErrors,
  ).join(", ");

  throw new Error(`Invalid environment variables: ${fields}`);
}

export const env = parsed.data;
export type Env = typeof env;
