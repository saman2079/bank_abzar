import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/dal";
import { env } from "@/lib/env";
import { isSameOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import { getRequestMeta } from "@/lib/request";
import { CHAT_COOKIE_MAX_AGE_SECONDS } from "@/modules/chat/constants";
import { CHAT_COOKIE } from "@/modules/chat/cookie";
import { cursorSchema, visitorMessageSchema } from "@/modules/chat/schemas";
import { pollVisitor, sendVisitorMessage } from "@/modules/chat/service";

const NO_STORE = { "Cache-Control": "no-store" };

function fail(error: string, status: number) {
  return Response.json({ ok: false, error }, { status, headers: NO_STORE });
}

/** دریافت پیام‌های جدید گفتگوی خود بازدیدکننده: `GET /api/chat?after=<seq>&markRead=1` */
export async function GET(request: Request) {
  const { ip } = await getRequestMeta();
  const limit = await rateLimit(`chat:poll:${ip}`, 120, 60);
  if (!limit.ok) return fail("درخواست‌ها زیاد است.", 429);

  const url = new URL(request.url);
  const after = cursorSchema.parse(url.searchParams.get("after") ?? 0);
  const markRead = url.searchParams.get("markRead") === "1";
  const token = (await cookies()).get(CHAT_COOKIE)?.value;

  const result = await pollVisitor(token, after, markRead);
  return Response.json({ ok: true, ...result }, { headers: NO_STORE });
}

/** ارسال پیام بازدیدکننده (JSON: `{ body, name? }`). گفتگوی تازه با اولین پیام ساخته و کوکی گذاشته می‌شود. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return fail("درخواست نامعتبر است.", 403);
  if (Number(request.headers.get("content-length") ?? 0) > 8_000) return fail("پیام خیلی بلند است.", 413);

  const { ip } = await getRequestMeta();
  const cookieStore = await cookies();
  const token = cookieStore.get(CHAT_COOKIE)?.value;

  const perMinute = await rateLimit(`chat:send:${ip}`, 15, 60);
  if (!perMinute.ok) return fail("پیام‌ها زیاد است؛ کمی صبر کنید.", 429);
  // ساخت گفتگوی تازه سخت‌گیرانه‌تر محدود است (ضد اسپم)
  if (!token) {
    const perHour = await rateLimit(`chat:new:${ip}`, 5, 3600);
    if (!perHour.ok) return fail("تعداد گفتگوهای جدید از این شبکه زیاد است؛ بعداً تلاش کنید.", 429);
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail("درخواست نامعتبر است.", 400);
  }
  const parsed = visitorMessageSchema.safeParse(json);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "پیام نامعتبر است.", 400);

  const user = await getCurrentUser();
  const result = await sendVisitorMessage({
    existingToken: token,
    body: parsed.data.body,
    name: parsed.data.name,
    userId: user?.id,
  });
  if (!result.ok) return fail(result.error, 400);

  if (result.token) {
    cookieStore.set(CHAT_COOKIE, result.token, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: CHAT_COOKIE_MAX_AGE_SECONDS,
    });
  }

  return Response.json({ ok: true, message: result.message }, { headers: NO_STORE });
}
