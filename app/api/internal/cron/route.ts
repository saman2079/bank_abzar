import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { cleanupExpired } from "@/lib/maintenance";
import { expireStaleOrders } from "@/modules/orders/service";
import { reconcilePendingPayments } from "@/modules/payments/service";

function isAuthorized(request: Request, secret: string): boolean {
  const received = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);

  return received.length === expected.length && timingSafeEqual(received, expected);
}

/**
 * کرون سرور (هر ۵ دقیقه):
 *   curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://DOMAIN/api/internal/cron
 */
async function run(request: Request) {
  if (!env.CRON_SECRET) return Response.json({ error: "cron is not configured" }, { status: 503 });
  if (!isAuthorized(request, env.CRON_SECRET)) return Response.json({ error: "unauthorized" }, { status: 401 });

  // اول پرداخت‌های معلق بازبینی می‌شوند، بعد سفارش‌های منقضی لغو (تا پرداخت واقعی‌شده لغو نشود).
  const reconciledPayments = await reconcilePendingPayments();
  const expiredOrders = await expireStaleOrders();
  const cleaned = await cleanupExpired();

  return Response.json({ reconciledPayments, expiredOrders, cleaned });
}

export const POST = run;
/** Vercel Cron فقط GET می‌زند (و خودش `Authorization: Bearer $CRON_SECRET` می‌فرستد). */
export const GET = run;
