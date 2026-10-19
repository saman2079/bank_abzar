import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";
import { getCurrentUser } from "@/lib/dal";
import { rateLimit } from "@/lib/rate-limit";
import { MAX_REQUEST_BYTES } from "@/modules/media/constants";
import { addProductImages } from "@/modules/media/service";

function fail(error: string, status: number) {
  return Response.json({ ok: false, error }, { status });
}

/** Origin باید با Host یکی باشد (دفاع اضافه روی SameSite=Lax). */
function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** آپلود چندفایلی تصویر محصول (multipart، فیلد `files`). فقط ادمین/استاف. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return fail("ابتدا وارد شوید.", 401);
  if (user.role !== "ADMIN" && user.role !== "STAFF") return fail("دسترسی ندارید.", 403);
  if (!isSameOrigin(request)) return fail("درخواست نامعتبر است.", 403);

  const limit = await rateLimit(`upload:${user.id}`, 30, 60);
  if (!limit.ok) return fail("درخواست‌ها زیاد است؛ کمی بعد دوباره تلاش کنید.", 429);

  if (Number(request.headers.get("content-length") ?? 0) > MAX_REQUEST_BYTES) return fail("حجم کل فایل‌ها زیاد است.", 413);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("درخواست نامعتبر است.", 400);
  }

  const files = form.getAll("files").filter((value): value is File => value instanceof File && value.size > 0);
  const { id } = await params;

  const result = await addProductImages(user, id, files);
  if (!result.ok) return fail(result.error, 400);

  revalidateTag(CACHE_TAGS.catalog, "max");
  revalidateTag(CACHE_TAGS.product(result.data.slug), "max");

  return Response.json({ ok: true, images: result.data.images });
}
