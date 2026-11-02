import { env } from "@/lib/env";
import { db } from "@/lib/db";

/**
 * Health check برای CI/CD و مانیتورینگ: `GET /api/health`
 * - `ok`: اتصال به دیتابیس برقرار است
 * - `commit`: شناسه‌ی کامیت نسخه‌ی در حال اجرا (روی Vercel؛ در غیر این صورت null)
 * هیچ اطلاعات حساسی برنمی‌گرداند و کش نمی‌شود.
 */
export async function GET() {
  const commit = env.VERCEL_GIT_COMMIT_SHA ?? null;
  const headers = { "Cache-Control": "no-store" };

  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ ok: true, commit }, { headers });
  } catch {
    return Response.json({ ok: false, commit }, { status: 503, headers });
  }
}
