"use client";

import { useFormStatus } from "react-dom";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addToCartAction } from "@/modules/cart/actions";

type AddToCartButtonProps = {
  productId: string;
  productName: string;
  inStock: boolean;
  /** icon: دکمه‌ی کوچک روی کارت محصول؛ full: دکمه‌ی بزرگ صفحه‌ی محصول */
  variant: "icon" | "full";
};

function Submit({ productName, inStock, variant }: Omit<AddToCartButtonProps, "productId">) {
  const { pending } = useFormStatus();

  if (variant === "icon") {
    return (
      <button
        type="submit"
        disabled={!inStock || pending}
        aria-label={`افزودن ${productName} به سبد خرید`}
        className="bg-primary text-primary-fg hover:bg-primary-hover disabled:bg-surface-2 disabled:text-muted grid size-9 place-items-center rounded-lg transition-colors disabled:pointer-events-none"
      >
        <ShoppingCart className="size-4" aria-hidden />
      </button>
    );
  }

  return (
    <Button type="submit" size="lg" className="w-full md:w-auto" disabled={!inStock || pending}>
      <ShoppingCart className="size-5" aria-hidden />
      {!inStock ? "ناموجود" : pending ? "در حال افزودن…" : "افزودن به سبد خرید"}
    </Button>
  );
}

export function AddToCartButton({ productId, productName, inStock, variant }: AddToCartButtonProps) {
  return (
    <form action={addToCartAction} className={variant === "icon" ? "relative z-10" : undefined}>
      <input type="hidden" name="productId" value={productId} />
      <Submit productName={productName} inStock={inStock} variant={variant} />
    </form>
  );
}
