import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { getCartCount } from "@/modules/cart/service";

const className =
  "text-fg hover:text-primary hover:bg-surface-2 relative grid size-10 place-items-center rounded-full transition-colors";

/** داینامیک (کوکی/DB)؛ همیشه داخل <Suspense> رندر شود. */
export async function CartLink() {
  const count = await getCartCount();

  return (
    <Link href="/cart" aria-label={count > 0 ? `سبد خرید (${formatNumber(count)} کالا)` : "سبد خرید"} className={className}>
      <ShoppingCart className="size-5" aria-hidden />
      {count > 0 ? (
        <span className="bg-primary text-primary-fg absolute end-0.5 top-0.5 grid min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold">
          {formatNumber(count)}
        </span>
      ) : null}
    </Link>
  );
}

export function CartLinkFallback() {
  return (
    <Link href="/cart" aria-label="سبد خرید" className={className}>
      <ShoppingCart className="size-5" aria-hidden />
    </Link>
  );
}
