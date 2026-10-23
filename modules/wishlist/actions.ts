"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/dal";
import { rateLimit } from "@/lib/rate-limit";
import { toggleFavoriteSchema } from "./schemas";
import { toggleFavorite } from "./service";

export type ToggleFavoriteState =
  | { status: "ok"; favorited: boolean }
  | { status: "unauthenticated" }
  | { status: "error"; message: string };

const MESSAGES = {
  "not-found": "این محصول در دسترس نیست.",
  limit: "سقف علاقه‌مندی‌ها پر شده است؛ چند مورد را حذف کنید.",
} as const;

/** مهمان خطای unauthenticated می‌گیرد و کلاینت او را به ورود می‌برد (بدون redirect سمت سرور). */
export async function toggleFavoriteAction(productId: string): Promise<ToggleFavoriteState> {
  const parsed = toggleFavoriteSchema.safeParse({ productId });
  if (!parsed.success) return { status: "error", message: "درخواست نامعتبر است." };

  const user = await getCurrentUser();
  if (!user) return { status: "unauthenticated" };

  if (!(await rateLimit(`wishlist:${user.id}`, 60, 60)).ok) {
    return { status: "error", message: "تعداد درخواست‌ها زیاد است؛ کمی بعد دوباره تلاش کنید." };
  }

  const result = await toggleFavorite(user.id, parsed.data.productId);
  if (!result.ok) return { status: "error", message: MESSAGES[result.error] };

  revalidatePath("/account/wishlist");
  return { status: "ok", favorited: result.favorited };
}
