import Link from "next/link";
import { Star } from "lucide-react";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { ProductImage } from "@/components/shared/product-image";
import { FavoriteButton } from "@/components/wishlist/favorite-button";
import { Badge } from "@/components/ui/badge";
import { discountPercent, formatNumber, formatToman } from "@/lib/format";
import type { ProductSummary } from "@/modules/catalog/types";

type ProductCardProps = { product: ProductSummary };

export function ProductCard({ product }: ProductCardProps) {
  const discount = discountPercent(product.price, product.compareAtPrice);

  return (
    <article className="border-border bg-surface hover:border-primary/60 group relative flex h-full flex-col rounded-card border p-3 transition-colors">
      <div className="flex items-center justify-between">
        <FavoriteButton productId={product.id} productName={product.name} />
        {!product.inStock ? (
          <Badge>ناموجود</Badge>
        ) : discount > 0 ? (
          <Badge tone="danger">٪{formatNumber(discount)}-</Badge>
        ) : null}
      </div>

      <div className="bg-surface-2 relative my-2 aspect-square overflow-hidden rounded-xl">
        <ProductImage image={product.image} sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw" />
      </div>

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
        <AddToCartButton productId={product.id} productName={product.name} inStock={product.inStock} variant="icon" />
      </div>
    </article>
  );
}
