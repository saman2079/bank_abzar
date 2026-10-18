import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ShoppingCart } from "lucide-react";
import { CartLineRow } from "@/components/cart/cart-line-row";
import { CartSummary } from "@/components/cart/cart-summary";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCart } from "@/modules/cart/service";

export const metadata: Metadata = {
  title: "سبد خرید",
  robots: { index: false, follow: false },
};

async function CartContent() {
  const cart = await getCart();

  if (cart.lines.length === 0) {
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">سبد خرید</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {cart.lines.map((line) => (
            <CartLineRow key={line.productId} line={line} />
          ))}
        </div>
        <div>
          <CartSummary subtotal={cart.subtotal}>
            {cart.hasIssues ? (
              <p role="alert" className="text-danger text-xs">
                ابتدا مشکل موجودی کالاهای علامت‌خورده را برطرف کنید.
              </p>
            ) : (
              <Link href="/checkout" className={buttonVariants({ size: "lg", className: "w-full" })}>
                ادامه و ثبت سفارش
              </Link>
            )}
          </CartSummary>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <Suspense fallback={<Skeleton className="h-72" />}>
      <CartContent />
    </Suspense>
  );
}
