"use server";

import { updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";
import { requireStaff } from "@/lib/dal";
import { formString, type ActionState } from "@/lib/form";
import { rateLimit } from "@/lib/rate-limit";
import { adjustStockSchema } from "./schemas";
import { adjustStock } from "./service";

export async function adjustStockAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();

  const parsed = adjustStockSchema.safeParse({
    productId: formString(formData, "productId"),
    mode: formString(formData, "mode"),
    quantity: formString(formData, "quantity"),
    note: formString(formData, "note"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر است." };

  const limit = await rateLimit(`stock:adjust:${staff.id}`, 60, 60);
  if (!limit.ok) return { error: "تغییرات پشت‌سرهم زیاد است؛ کمی صبر کنید." };

  const result = await adjustStock(staff, parsed.data);
  if (!result.ok) return { error: result.error };

  updateTag(CACHE_TAGS.catalog);
  updateTag(CACHE_TAGS.product(result.slug));
  return { ok: true };
}
