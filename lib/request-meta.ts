import "server-only";
import { headers } from "next/headers";

/** پشت Caddy مقدار `x-forwarded-for` توسط پروکسی تنظیم می‌شود (مقدار کلاینت جایگزین می‌شود). */
export async function getRequestMeta(): Promise<{ ip: string; userAgent: string | null }> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = (forwarded || h.get("x-real-ip") || "unknown").slice(0, 64);
  const userAgent = h.get("user-agent")?.slice(0, 255) ?? null;

  return { ip, userAgent };
}