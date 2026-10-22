import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { listSitemapArticles, listSitemapCategories, listSitemapProducts } from "@/modules/seo/queries";

/** فقط صفحه‌های عمومیِ ایندکس‌شدنی. سبد، پرداخت، حساب و ادمین عمداً نیستند (noindex). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, articles] = await Promise.all([listSitemapProducts(), listSitemapCategories(), listSitemapArticles()]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/products"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/categories"), changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/blog"), changeFrequency: "daily", priority: 0.7 },
    { url: absoluteUrl("/about"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/contact"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/rules"), changeFrequency: "yearly", priority: 0.2 },
  ];

  return [
    ...staticPages,
    ...categories.map((item) => ({ url: absoluteUrl(`/categories/${item.slug}`), lastModified: item.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((item) => ({ url: absoluteUrl(`/products/${item.slug}`), lastModified: item.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...articles.map((item) => ({ url: absoluteUrl(`/blog/${item.slug}`), lastModified: item.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
