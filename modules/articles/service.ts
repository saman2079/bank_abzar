import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { diffFields, writeAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { isUniqueViolation } from "@/lib/db-errors";
import { htmlToText, readingMinutes, sanitizeArticleHtml } from "@/lib/sanitize";
import type { SessionUser } from "@/lib/session";
import { ARTICLE_MIN_TEXT_TO_PUBLISH } from "./constants";
import type { ArticleInput } from "./schemas";

export type SaveArticleResult =
  | { ok: true; id: string; slug: string; /** نامک قبلی (اگر عوض شده) برای بی‌اعتبارسازی کش */ oldSlug: string | null }
  | { ok: false; error: string };

class ArticleError extends Error {}

/**
 * ساخت/ویرایش مقاله. HTML همیشه همین‌جا (سمت سرور) sanitize می‌شود؛ ورودی کلاینت هرگز مستقیم ذخیره نمی‌شود.
 * - `publishedAt` در اولین انتشار ست می‌شود و بعداً عوض نمی‌شود.
 * - تغییر slug → نامک قبلی در `ArticleSlugHistory` برای ریدایرکت ۳۰۱ ذخیره می‌شود.
 */
export async function saveArticle(actor: SessionUser, input: ArticleInput): Promise<SaveArticleResult> {
  const contentHtml = sanitizeArticleHtml(input.contentHtml);
  const text = htmlToText(contentHtml);

  if (input.status === "PUBLISHED" && text.length < ARTICLE_MIN_TEXT_TO_PUBLISH) {
    return { ok: false, error: `برای انتشار، متن مقاله حداقل ${ARTICLE_MIN_TEXT_TO_PUBLISH} کاراکتر باشد.` };
  }

  const data = {
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt,
    contentHtml,
    contentJson: input.contentJson as Prisma.InputJsonObject,
    coverUrl: input.coverUrl,
    coverAlt: input.coverUrl ? input.coverAlt : null,
    status: input.status,
    readingMinutes: readingMinutes(text),
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
  };

  try {
    return await db.$transaction(async (tx) => {
      const existing = input.id
        ? await tx.article.findUnique({ where: { id: input.id }, select: { id: true, slug: true, title: true, status: true, publishedAt: true } })
        : null;
      if (input.id && !existing) throw new ArticleError("مقاله پیدا نشد.");

      const publishedAt = existing?.publishedAt ?? (input.status === "PUBLISHED" ? new Date() : null);

      const saved = existing
        ? await tx.article.update({ where: { id: existing.id }, data: { ...data, publishedAt }, select: { id: true } })
        : await tx.article.create({ data: { ...data, publishedAt, createdById: actor.id }, select: { id: true } });

      // نامکِ جدید نباید به جای دیگری ریدایرکت شود؛ نامکِ قبلی (اگر عوض شده) ثبت می‌شود.
      await tx.articleSlugHistory.deleteMany({ where: { slug: input.slug } });
      if (existing && existing.slug !== input.slug) {
        await tx.articleSlugHistory.create({ data: { articleId: existing.id, slug: existing.slug } });
      }

      await writeAudit(
        {
          actor,
          action: existing ? "article.update" : "article.create",
          entity: "article",
          entityId: saved.id,
          diff: existing
            ? diffFields({ title: existing.title, slug: existing.slug, status: existing.status }, { title: input.title, slug: input.slug, status: input.status })
            : { title: input.title, slug: input.slug, status: input.status },
        },
        tx,
      );

      return { ok: true, id: saved.id, slug: input.slug, oldSlug: existing && existing.slug !== input.slug ? existing.slug : null } as const;
    });
  } catch (error) {
    if (error instanceof ArticleError) return { ok: false, error: error.message };
    if (isUniqueViolation(error)) return { ok: false, error: "این نامک (slug) قبلاً برای مقاله‌ی دیگری استفاده شده است." };
    throw error;
  }
}
