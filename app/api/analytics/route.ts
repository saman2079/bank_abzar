import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/dal";
import { isSameOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import { getRequestMeta } from "@/lib/request";
import { isBot } from "@/modules/analytics/classify";
import { SESSION_COOKIE_SECONDS, VISITOR_COOKIE_SECONDS } from "@/modules/analytics/constants";
import { SESSION_COOKIE, VISITOR_COOKIE, cookieOptions, newId, validId } from "@/modules/analytics/cookie";
import { trackSchema } from "@/modules/analytics/schemas";
import { recordPageEvent } from "@/modules/analytics/service";
import { isStaffRole } from "@/modules/auth/constants";

function done(status = 204): Response {
  return new Response(null, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * دریافت رویداد آنالیتیکس از ردیاب سایت (`components/analytics/analytics-tracker.tsx`).
 * بدون IP در DB؛ ربات‌ها و کارمندان واردشده ثبت نمی‌شوند؛ خطا هرگز به کاربر نشان داده نمی‌شود.
 */
export async function POST(request: Request) {
  // sendBeacon در بعضی مرورگرها Origin نمی‌فرستد؛ فقط Origin ناهمخوان رد می‌شود.
  if (request.headers.get("origin") && !isSameOrigin(request)) return done(403);
  if (Number(request.headers.get("content-length") ?? 0) > 3_000) return done(413);

  const { ip, userAgent } = await getRequestMeta();
  if (isBot(userAgent)) return done();
  if (!(await rateLimit(`analytics:${ip}`, 300, 60)).ok) return done(429);

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return done(400);
  }
  const parsed = trackSchema.safeParse(json);
  if (!parsed.success) return done(400);
  const data = parsed.data;

  const user = await getCurrentUser();
  if (user && isStaffRole(user.role)) return done();

  const store = await cookies();
  const existingVisitor = validId(store.get(VISITOR_COOKIE)?.value);
  const existingSession = validId(store.get(SESSION_COOKIE)?.value);

  // ماندگاری (LEAVE) بدون نشست فعال معنایی ندارد (نشست قبلاً منقضی شده).
  if (data.type === "LEAVE" && !existingSession) return done();

  const visitorId = existingVisitor ?? newId();
  const sessionId = existingSession ?? newId();

  await recordPageEvent({
    ...data,
    visitorId,
    sessionId,
    isEntry: !existingSession,
    newVisitor: !existingVisitor,
    userId: user?.id ?? null,
    userAgent,
    ownHost: request.headers.get("x-forwarded-host") ?? request.headers.get("host"),
  });

  if (!existingVisitor || !existingSession) store.set(VISITOR_COOKIE, visitorId, cookieOptions(VISITOR_COOKIE_SECONDS));
  store.set(SESSION_COOKIE, sessionId, cookieOptions(SESSION_COOKIE_SECONDS));

  return done();
}
