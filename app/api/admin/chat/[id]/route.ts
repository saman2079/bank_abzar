import { getCurrentUser } from "@/lib/dal";
import { isSameOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import { pollConversationForStaff, sendStaffMessage } from "@/modules/chat/admin/service";
import { cursorSchema, staffMessageSchema } from "@/modules/chat/schemas";

const NO_STORE = { "Cache-Control": "no-store" };

function fail(error: string, status: number) {
  return Response.json({ ok: false, error }, { status, headers: NO_STORE });
}

async function staffOrNull() {
  const user = await getCurrentUser();
  return user && (user.role === "ADMIN" || user.role === "STAFF") ? user : null;
}

type Context = { params: Promise<{ id: string }> };

/** پیام‌های جدید گفتگو برای پنل (و علامت‌زدن به‌عنوان خوانده‌شده): `GET ?after=<seq>` */
export async function GET(request: Request, { params }: Context) {
  const user = await staffOrNull();
  if (!user) return fail("دسترسی ندارید.", 403);

  const { id } = await params;
  if (id.length > 40) return fail("گفتگو پیدا نشد.", 404);

  const limit = await rateLimit(`chat:admin-poll:${user.id}`, 120, 60);
  if (!limit.ok) return fail("درخواست‌ها زیاد است.", 429);

  const after = cursorSchema.parse(new URL(request.url).searchParams.get("after") ?? 0);
  const result = await pollConversationForStaff(id, after);
  if (!result) return fail("گفتگو پیدا نشد.", 404);

  return Response.json({ ok: true, ...result }, { headers: NO_STORE });
}

/** پاسخ ادمین/کارمند (JSON: `{ body }`). */
export async function POST(request: Request, { params }: Context) {
  const user = await staffOrNull();
  if (!user) return fail("دسترسی ندارید.", 403);
  if (!isSameOrigin(request)) return fail("درخواست نامعتبر است.", 403);

  const { id } = await params;
  if (id.length > 40) return fail("گفتگو پیدا نشد.", 404);

  const limit = await rateLimit(`chat:admin-send:${user.id}`, 60, 60);
  if (!limit.ok) return fail("پیام‌ها زیاد است.", 429);

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail("درخواست نامعتبر است.", 400);
  }
  const parsed = staffMessageSchema.safeParse(json);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "پیام نامعتبر است.", 400);

  const result = await sendStaffMessage(id, user.id, parsed.data.body);
  if (!result.ok) return fail(result.error, 400);

  return Response.json({ ok: true, message: result.message }, { headers: NO_STORE });
}
