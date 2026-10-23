import type { Metadata } from "next";
import Link from "next/link";
import { ProductGrid } from "@/components/shared/product-grid";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/dal";
import { listFavoriteProducts } from "@/modules/wishlist/queries";

export const metadata: Metadata = { title: "علاقه‌مندی‌ها" };

export default async function WishlistPage() {
  const user = await requireUser("/account/wishlist");
  const products = await listFavoriteProducts(user.id);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-extrabold">علاقه‌مندی‌ها</h1>

      {products.length === 0 ? (
        <div className="border-border bg-surface rounded-card space-y-4 border p-8 text-center">
          <p className="text-muted text-sm">هنوز محصولی را به علاقه‌مندی‌ها اضافه نکرده‌اید. روی قلب هر محصول بزنید.</p>
          <Link href="/products" className={buttonVariants({ size: "md" })}>
            مشاهده‌ی محصولات
          </Link>
        </div>
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
