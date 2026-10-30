"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { ShoppingCart } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { MAX_CART_QUANTITY } from "@/modules/cart/constants";
import { setCartQuantityAction } from "@/modules/cart/actions";
import type { CartLine } from "@/modules/cart/types";
import { calcShipping } from "@/modules/orders/constants";
import type { ShippingSettings } from "@/modules/settings/constants";
import { CartLineRow } from "./cart-line-row";
import { CartSummaryCard } from "./cart-summary-card";

type Change = { productId: string; quantity: number };

/** همان قانون سمت سرور (`setCartQuantity`): سقف = کمترین مقدار از حداکثر سبد و موجودی (حداقل ۱). */
function applyChange(lines: CartLine[], change: Change): CartLine[] {
  return lines.flatMap((line) => {
    if (line.productId !== change.productId) return [line];
    if (change.quantity <= 0) return [];
    const quantity = Math.min(change.quantity, MAX_CART_QUANTITY, Math.max(line.stock, 1));
    return [{ ...line, quantity, lineTotal: line.unitPrice * quantity }];
  });
}

/**
 * سبد با به‌روزرسانی آنی: تعداد، جمع ردیف و خلاصه‌ی سفارش همان لحظه‌ی کلیک عوض می‌شوند و
 * Server Action در پس‌زمینه اجرا می‌شود؛ بعد از پایان، داده‌ی واقعی سرور جای حالت خوش‌بینانه را می‌گیرد
 * (اگر سرور چیزی را رد کند، خودکار به مقدار درست برمی‌گردد). مبلغ نهایی سفارش همیشه سمت سرور محاسبه می‌شود.
 */
export function CartView({ lines: serverLines, shipping }: { lines: CartLine[]; shipping: ShippingSettings }) {
  const [lines, change] = useOptimistic(serverLines, applyChange);
  const [, startTransition] = useTransition();

  function setQuantity(productId: string, quantity: number) {
    startTransition(async () => {
      change({ productId, quantity });
      const formData = new FormData();
      formData.set("productId", productId);
      formData.set("quantity", String(quantity));
      await setCartQuantityAction(formData);
    });
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <ShoppingCart className="text-muted mx-auto size-16" strokeWidth={1.25} aria-hidden />
        <h1 className="mt-6 text-xl font-extrabold">سبد خرید شما خالی است</h1>
        <p className="text-muted mt-2 text-sm">برای شروع خرید، محصولات فروشگاه را ببینید.</p>
        <Link href="/products" className={buttonVariants({ size: "lg", className: "mt-8" })}>
          مشاهده محصولات
        </Link>
      </div>
    );
  }

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const hasIssues = lines.some((line) => line.stock < line.quantity);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">سبد خرید</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {lines.map((line) => (
            <CartLineRow key={line.productId} line={line} onChangeQuantity={setQuantity} />
          ))}
        </div>
        <div>
          <CartSummaryCard subtotal={subtotal} shipping={calcShipping(subtotal, shipping)}>
            {hasIssues ? (
              <p role="alert" className="text-danger text-xs">
                ابتدا مشکل موجودی کالاهای علامت‌خورده را برطرف کنید.
              </p>
            ) : (
              <Link href="/checkout" className={buttonVariants({ size: "lg", className: "w-full" })}>
                ادامه و ثبت سفارش
              </Link>
            )}
          </CartSummaryCard>
        </div>
      </div>
    </div>
  );
}
