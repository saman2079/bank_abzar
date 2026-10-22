import { cacheLife, cacheTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";
import { db } from "@/lib/db";

export type SitemapEntry = { slug: string; updatedAt: Date };

/** داده‌ی sitemap.xml؛ کش‌شده و با همان تگ‌های کاتالوگ/مقاله بی‌اعتبار می‌شود. */
export async function listSitemapProducts(): Promise<SitemapEntry[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalog);

  return db.product.findMany({ where: { status: "ACTIVE" }, select: { slug: true, updatedAt: true }, orderBy: { updatedAt: "desc" } });
}

export async function listSitemapCategories(): Promise<SitemapEntry[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.categories);

  return db.category.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } });
}

export async function listSitemapArticles(): Promise<SitemapEntry[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.articles);

  return db.article.findMany({ where: { status: "PUBLISHED", publishedAt: { not: null } }, select: { slug: true, updatedAt: true }, orderBy: { updatedAt: "desc" } });
}
