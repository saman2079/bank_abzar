import { getCurrentUser } from "@/lib/dal";
import { rateLimit } from "@/lib/rate-limit";
import { countUnreadConversations } from "@/modules/chat/admin/queries";

/** تعداد گفتگوهای خوانده‌نشده برای نشان کنار منوی پنل: `GET /api/admin/chat/unread` */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
    return Response.json({ ok: false }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const limit = await rateLimit(`chat:unread:${user.id}`, 60, 60);
  if (!limit.ok) return Response.json({ ok: false }, { status: 429, headers: { "Cache-Control": "no-store" } });

  return Response.json({ ok: true, count: await countUnreadConversations() }, { headers: { "Cache-Control": "no-store" } });
}
