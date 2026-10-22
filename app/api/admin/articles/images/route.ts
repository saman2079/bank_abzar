import { getCurrentUser } from "@/lib/dal";
import { isSameOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import { MAX_FILE_BYTES } from "@/modules/media/constants";
import { addArticleImage } from "@/modules/media/article-image";

function fail(error: string, status: number) {
  return Response.json({ ok: false, error }, { status });
}

/** آپلود یک تصویر مقاله (multipart، فیلد `file`). فقط ادمین/استاف. خروجی: `{ ok, url }`. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("ابتدا وارد شوید.", 401);
  if (user.role !== "ADMIN" && user.role !== "STAFF") return fail("دسترسی ندارید.", 403);
  if (!isSameOrigin(request)) return fail("درخواست نامعتبر است.", 403);

  const limit = await rateLimit(`upload:${user.id}`, 30, 60);
  if (!limit.ok) return fail("درخواست‌ها زیاد است؛ کمی بعد دوباره تلاش کنید.", 429);

  if (Number(request.headers.get("content-length") ?? 0) > MAX_FILE_BYTES + 100_000) return fail("حجم تصویر زیاد است.", 413);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("درخواست نامعتبر است.", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) return fail("فایلی ارسال نشده است.", 400);

  const result = await addArticleImage(file);
  if (!result.ok) return fail(result.error, 400);

  return Response.json({ ok: true, url: result.url });
}
