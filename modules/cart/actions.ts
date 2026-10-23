"use server";

import { revalidatePath } from "next/cache";
import { formString } from "@/lib/form";
import { rateLimit } from "@/lib/rate-limit";
import { getRequestMeta } from "@/lib/request";
import { addToCartSchema, setQuantitySchema } from "./schemas";
import { addToCart, setCartQuantity } from "./service";

/** سقف تغییرات سبد برای هر IP (سبد مهمان هم به DB/کوکی می‌نویسد). */
async function withinCartLimit(): Promise<boolean> {
  const { ip } = await getRequestMeta();
  return (await rateLimit(`cart:${ip}`, 120, 60)).ok;
}

/** هدر (شمارنده‌ی سبد) در همه‌ی صفحه‌هاست؛ بعد از هر تغییر کل لی‌اوت تازه می‌شود. */
function refreshEverywhere() {
  revalidatePath("/", "layout");
}

export async function addToCartAction(formData: FormData): Promise<void> {
  const parsed = addToCartSchema.safeParse({ productId: formString(formData, "productId") });
  if (!parsed.success || !(await withinCartLimit())) return;

  await addToCart(parsed.data.productId);
  refreshEverywhere();
}

export async function setCartQuantityAction(formData: FormData): Promise<void> {
  const parsed = setQuantitySchema.safeParse({
    productId: formString(formData, "productId"),
    quantity: formString(formData, "quantity"),
  });
  if (!parsed.success || !(await withinCartLimit())) return;

  await setCartQuantity(parsed.data.productId, parsed.data.quantity);
  refreshEverywhere();
}
