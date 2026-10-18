import { z } from "zod";
import { MAX_CART_LINES, MAX_CART_QUANTITY } from "./constants";

export const cartLineSchema = z.object({
  productId: z.string().min(1).max(40),
  quantity: z.number().int().min(1).max(MAX_CART_QUANTITY),
});

/** محتوای کوکی سبد مهمان؛ هر چیز نامعتبر به سبد خالی تبدیل می‌شود. */
export const guestCartSchema = z.array(cartLineSchema).max(MAX_CART_LINES);

export const addToCartSchema = z.object({ productId: z.string().min(1).max(40) });

export const setQuantitySchema = z.object({
  productId: z.string().min(1).max(40),
  quantity: z.coerce.number().int().min(0).max(MAX_CART_QUANTITY),
});
