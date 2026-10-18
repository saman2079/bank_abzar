"use server";

import { revalidatePath } from "next/cache";
import { formString } from "@/lib/form";
import { addToCartSchema, setQuantitySchema } from "./schemas";
import { addToCart, setCartQuantity } from "./service";

/** هدر (شمارنده‌ی سبد) در همه‌ی صفحه‌هاست؛ بعد از هر تغییر کل لی‌اوت تازه می‌شود. */
function refreshEverywhere() {
  revalidatePath("/", "layout");
}

export async function addToCartAction(formData: FormData): Promise<void> {
  const parsed = addToCartSchema.safeParse({ productId: formString(formData, "productId") });
  if (!parsed.success) return;

  await addToCart(parsed.data.productId);
  refreshEverywhere();
}

export async function setCartQuantityAction(formData: FormData): Promise<void> {
  const parsed = setQuantitySchema.safeParse({
    productId: formString(formData, "productId"),
    quantity: formString(formData, "quantity"),
  });
  if (!parsed.success) return;

  await setCartQuantity(parsed.data.productId, parsed.data.quantity);
  refreshEverywhere();
}
