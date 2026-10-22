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

export const SITE_NAME = "بانک ابزار";

/** schema.org Organization؛ لوگو/تلفن/شبکه‌های اجتماعی بعد از گرفتن اطلاعات از صاحب فروشگاه اضافه شود. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: absoluteUrl("/"),
  };
}

/** WebSite + کادر جستجوی سایت (به `/products?q=` وصل است). */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    inLanguage: "fa-IR",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl("/products")}?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export type ArticleJsonLdInput = {
  slug: string;
  title: string;
  description: string;
  coverUrl: string | null;
  publishedAt: Date;
  updatedAt: Date;
};

export function articleJsonLd(article: ArticleJsonLdInput) {
  const url = absoluteUrl(`/blog/${article.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    inLanguage: "fa-IR",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    datePublished: article.publishedAt.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    ...(article.coverUrl && { image: [article.coverUrl.startsWith("http") ? article.coverUrl : absoluteUrl(article.coverUrl)] }),
    author: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
    publisher: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
  };
}
