import "server-only";
import { db } from "@/lib/db";

export type RateLimitResult = {
  ok: boolean;
  /** ثانیه‌های باقی‌مانده تا پایان پنجره */
  retryAfter: number;
};

/**
 * محدودکننده‌ی ثابت‌پنجره روی Postgres (یک سرور، بدون Redis).
 * شمارش با یک `INSERT ... ON CONFLICT` اتمیک انجام می‌شود تا درخواست‌های همزمان از حد رد نشوند.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const rows = await db.$queryRaw<{ count: number; reset_at: Date }[]>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt")
    VALUES (${key}, 1, now() + make_interval(secs => ${windowSeconds}))
    ON CONFLICT ("key") DO UPDATE SET
      "count"   = CASE WHEN "RateLimit"."resetAt" <= now() THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" <= now() THEN now() + make_interval(secs => ${windowSeconds}) ELSE "RateLimit"."resetAt" END
    RETURNING "count", "resetAt" AS reset_at
  `;

  const row = rows[0];
  if (!row) return { ok: false, retryAfter: windowSeconds };

  const retryAfter = Math.max(1, Math.ceil((row.reset_at.getTime() - Date.now()) / 1000));

  return { ok: row.count <= limit, retryAfter };
}