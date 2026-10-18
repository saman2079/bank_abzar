import Link from "next/link";
import { Drill, Heart, ShoppingCart, Star } from "lucide-react";
import { discountPercent, formatNumber, formatToman } from "@/lib/format";
import type { ProductSummary } from "@/modules/catalog/types";
import { Badge } from "@/components/ui/Badge";

type ProductCardProps = { product: ProductSummary };

export function ProductCard({ product }: ProductCardProps) {
  const discount = discountPercent(product.price, product.compareAtPrice);

  return (
    <article className="border-border bg-surface hover:border-primary/60 group relative flex h-full flex-col rounded-card border p-3 transition-colors">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="افزودن به علاقه‌مندی‌ها"
          className="text-muted hover:text-danger grid size-8 place-items-center rounded-full transition-colors"
        >
          <Heart className="size-4" aria-hidden />
        </button>
        {discount > 0 && <Badge tone="danger">٪{formatNumber(discount)}-</Badge>}
      </div>

      {/* جایگزین: <Image> با تصویر واقعی محصول */}
      <Link href={`/products/${product.slug}`} className="block" tabIndex={-1} aria-hidden>
        <div className="bg-surface-2 text-muted my-2 grid aspect-square place-items-center rounded-xl">
          <Drill className="size-14" strokeWidth={1.25} aria-hidden />
        </div>
      </Link>

      <p className="text-muted text-start text-xs font-bold tracking-wide" dir="ltr">
        {product.brand}
      </p>
      <h3 className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 font-medium">
        <Link href={`/products/${product.slug}`} className="after:absolute after:inset-0 after:content-['']">
          {product.name}
        </Link>
      </h3>

      <div className="text-muted mt-2 flex items-center gap-1 text-xs">
        <Star className="fill-primary text-primary size-3.5" aria-hidden />
        <span className="text-fg font-bold">{formatNumber(product.rating)}</span>
        <span>({formatNumber(product.ratingCount)})</span>
      </div>

      <div className="mt-auto flex items-end justify-between pt-3">
        <div>
          {product.compareAtPrice ? (
            <p className="text-muted text-xs line-through">{formatNumber(product.compareAtPrice)}</p>
          ) : null}
          <p className="font-extrabold">{formatToman(product.price)}</p>
        </div>
        <button
          type="button"
          aria-label={`افزودن ${product.name} به سبد خرید`}
          className="bg-primary text-primary-fg hover:bg-primary-hover relative z-10 grid size-9 place-items-center rounded-lg transition-colors"
        >
          <ShoppingCart className="size-4" aria-hidden />
        </button>
      </div>
    </article>
  );
}