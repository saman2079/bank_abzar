import { cacheLife, cacheTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";
import { db } from "@/lib/db";
import { sanitizeArticleHtml } from "@/lib/sanitize";

export const BLOG_PAGE_SIZE = 9;

export type ArticleSummary = {
  slug: string;
  title: string;
  excerpt: string;
  coverUrl: string | null;
  coverAlt: string | null;
  publishedAt: Date;
  readingMinutes: number;
};

export type ArticleDetail = ArticleSummary & {
  contentHtml: string;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: Date;
};

const published = { status: "PUBLISHED" as const, publishedAt: { not: null } };

const summarySelect = {
  slug: true,
  title: true,
  excerpt: true,
  coverUrl: true,
  coverAlt: true,
  publishedAt: true,
  createdAt: true,
  readingMinutes: true,
};

type SummaryRow = {
  slug: string;
  title: string;
  excerpt: string;
  coverUrl: string | null;
  coverAlt: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  readingMinutes: number;
};

function toSummary(row: SummaryRow): ArticleSummary {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    coverUrl: row.coverUrl,
    coverAlt: row.coverAlt,
    publishedAt: row.publishedAt ?? row.createdAt,
    readingMinutes: row.readingMinutes,
  };
}

/** لیست مقاله‌های منتشرشده (جدیدترین اول) با صفحه‌بندی. */
export async function listPublishedArticles(page: number): Promise<{ items: ArticleSummary[]; total: number; totalPages: number }> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.articles);

  const [total, rows] = await Promise.all([
    db.article.count({ where: published }),
    db.article.findMany({
      where: published,
      orderBy: [{ publishedAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * BLOG_PAGE_SIZE,
      take: BLOG_PAGE_SIZE,
      select: summarySelect,
    }),
  ]);

  return { items: rows.map(toSummary), total, totalPages: Math.max(1, Math.ceil(total / BLOG_PAGE_SIZE)) };
}

/** جدیدترین مقاله‌ها (مثلاً «مقاله‌های مرتبط»)، با امکان حذف یک مقاله. */
export async function listLatestArticles(limit: number, excludeSlug?: string): Promise<ArticleSummary[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.articles);

  const rows = await db.article.findMany({
    where: { ...published, ...(excludeSlug ? { slug: { not: excludeSlug } } : {}) },
    orderBy: [{ publishedAt: "desc" }, { id: "asc" }],
    take: limit,
    select: summarySelect,
  });
  return rows.map(toSummary);
}

/** مقاله‌ی منتشرشده با نامک. HTML بار دیگر هنگام خواندن هم sanitize می‌شود (دفاع دولایه؛ نتیجه کش می‌شود). */
export async function getArticleBySlug(slug: string): Promise<ArticleDetail | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.article(slug));

  const row = await db.article.findFirst({
    where: { slug, ...published },
    select: { ...summarySelect, contentHtml: true, seoTitle: true, seoDescription: true, updatedAt: true },
  });
  if (!row) return null;

  return { ...toSummary(row), contentHtml: sanitizeArticleHtml(row.contentHtml), seoTitle: row.seoTitle, seoDescription: row.seoDescription, updatedAt: row.updatedAt };
}

export async function listArticleSlugs(): Promise<string[]> {
  const rows = await db.article.findMany({ where: published, select: { slug: true } });
  return rows.map((row) => row.slug);
}

/** اگر نامک قدیمیِ یک مقاله‌ی منتشرشده باشد، نامک فعلی را برمی‌گرداند (برای ریدایرکت دائمی). */
export async function getArticleRedirectTarget(oldSlug: string): Promise<string | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.articles);

  const row = await db.articleSlugHistory.findFirst({
    where: { slug: oldSlug, article: { status: "PUBLISHED" } },
    orderBy: { createdAt: "desc" },
    select: { article: { select: { slug: true } } },
  });
  return row?.article.slug ?? null;
}
