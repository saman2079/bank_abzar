import { getCurrentUser } from "@/lib/dal";
import { listFavoriteIds } from "@/modules/wishlist/queries";

/** شناسه‌ی علاقه‌مندی‌های کاربر فعلی؛ مهمان → `authenticated:false`. هرگز کش نمی‌شود. */
export async function GET() {
  const user = await getCurrentUser();
  const body = user
    ? { authenticated: true, ids: await listFavoriteIds(user.id) }
    : { authenticated: false, ids: [] as string[] };

  return Response.json(body, { headers: { "Cache-Control": "private, no-store" } });
}
