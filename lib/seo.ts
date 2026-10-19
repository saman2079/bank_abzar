import { env } from "@/lib/env";
import type { ProductDetail } from "@/modules/catalog/types";

export function absoluteUrl(path: string): string {
  return new URL(path, env.NEXT_PUBLIC_SITE_URL).toString();
}

/**
 * قیمت در دیتابیس تومان است؛ اسکیمای schema.org ارز ISO می‌خواهد (IRR) پس ×۱۰.
 * توجه: گوگل برای نمایش rich result محصول، فیلد `image` را هم می‌خواهد؛
 * با آمدن تصاویر واقعی (فاز ۶) اضافه می‌شود.
 */
export function productJsonLd(product: ProductDetail) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.shortDescription,
    brand: { "@type": "Brand", name: product.brand },
    ...(product.images.length > 0 && {
      image: product.images.map((image) => (image.url.startsWith("http") ? image.url : absoluteUrl(image.url))),
    }),
    ...(product.ratingCount > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating,
        reviewCount: product.ratingCount,
      },
    }),
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/products/${product.slug}`),
      priceCurrency: "IRR",
      price: product.price * 10,
      availability:
        product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };
}

export type BreadcrumbItem = { name: string; path: string };

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
