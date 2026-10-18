import { env } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { callbackQuerySchema } from "@/modules/payments/schemas";
import { completePayment } from "@/modules/payments/service";

function redirectTo(path: string) {
  return Response.redirect(new URL(path, env.NEXT_PUBLIC_SITE_URL), 303);
}

/**
 * بازگشت کاربر از زرین‌پال: `?Authority=...&Status=OK|NOK`.
 * امنیت: به Status اعتماد نمی‌شود؛ پرداخت فقط با verify سمت سرور (مبلغ از DB) تأیید می‌شود.
 */
export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = await rateLimit(`pay:callback:ip:${ip}`, 60, 60);
  if (!limit.ok) return new Response("Too Many Requests", { status: 429 });

  const url = new URL(request.url);
  const query = callbackQuerySchema.safeParse({
    Authority: url.searchParams.get("Authority"),
    Status: url.searchParams.get("Status"),
  });
  if (!query.success) return redirectTo("/account/orders");

  const outcome = await completePayment(query.data.Authority, query.data.Status);
  if (!outcome) return redirectTo("/account/orders");

  return redirectTo(`/account/orders/${outcome.orderId}?payment=${outcome.status}`);
}
