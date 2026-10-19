import { readFile } from "node:fs/promises";
import { resolveLocalPath } from "@/lib/storage/local";

/**
 * سرو فایل‌های آپلودشده‌ی درایور `local` (روی Vercel با درایور blob استفاده نمی‌شود).
 * نام فایل‌ها UUID یکتا است و هیچ‌وقت بازنویسی نمی‌شود، پس کش immutable امن است.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  const file = segments.at(-1)?.endsWith(".webp") ? resolveLocalPath(segments) : null;
  if (!file) return new Response("Not found", { status: 404 });

  try {
    const data = await readFile(file);

    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
