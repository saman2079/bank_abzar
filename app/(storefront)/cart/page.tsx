import type { Metadata } from "next";
import { Suspense } from "react";
import { CartView } from "@/components/cart/cart-view";
import { Skeleton } from "@/components/ui/skeleton";
import { getCart } from "@/modules/cart/service";
import { getShippingSettings } from "@/modules/settings/queries";

export const metadata: Metadata = {
  title: "سبد خرید",
  robots: { index: false, follow: false },
};

async function CartContent() {
  const [cart, shipping] = await Promise.all([getCart(), getShippingSettings()]);

  return <CartView lines={cart.lines} shipping={shipping} />;
}

export default function CartPage() {
  return (
    <Suspense fallback={<Skeleton className="h-72" />}>
      <CartContent />
    </Suspense>
  );
}
