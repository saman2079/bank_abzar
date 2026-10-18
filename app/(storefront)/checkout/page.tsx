import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AddressForm } from "@/components/account/address-form";
import { CartSummary } from "@/components/cart/cart-summary";
import { CheckoutForm } from "@/components/cart/checkout-form";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUser } from "@/lib/dal";
import { formatNumber, formatToman } from "@/lib/format";
import { getCart } from "@/modules/cart/service";
import { listAddresses } from "@/modules/users/queries";

export const metadata: Metadata = {
  title: "ثبت سفارش",
  robots: { index: false, follow: false },
};

async function CheckoutContent() {
  const user = await requireUser("/checkout");
  const [cart, addresses] = await Promise.all([getCart(), listAddresses(user.id)]);

  if (cart.lines.length === 0 || cart.hasIssues) redirect("/cart");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">ثبت سفارش</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className="space-y-4 p-5">
            {addresses.length > 0 ? (
              <CheckoutForm addresses={addresses} />
            ) : (
              <>
                <h2 className="font-bold">آدرس تحویل</h2>
                <p className="text-muted text-sm">برای ثبت سفارش، آدرس خود را وارد کنید.</p>
              </>
            )}
          </Card>

          <Card className="space-y-4 p-5">
            <details open={addresses.length === 0}>
              <summary className="text-primary cursor-pointer text-sm font-bold">
                {addresses.length === 0 ? "ثبت آدرس" : "افزودن آدرس جدید"}
              </summary>
              <div className="pt-4">
                <AddressForm idPrefix="checkout-new" />
              </div>
            </details>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="space-y-2 p-5">
            <h2 className="font-extrabold">کالاها</h2>
            <ul className="space-y-2 text-sm">
              {cart.lines.map((line) => (
                <li key={line.productId} className="flex justify-between gap-3">
                  <span className="line-clamp-1">
                    {line.name} × {formatNumber(line.quantity)}
                  </span>
                  <span className="shrink-0">{formatToman(line.lineTotal)}</span>
                </li>
              ))}
            </ul>
          </Card>
          <CartSummary subtotal={cart.subtotal} />
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <CheckoutContent />
    </Suspense>
  );
}
