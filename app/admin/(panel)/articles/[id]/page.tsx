import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { ArticleForm } from "@/components/admin/article-form";
import { PageHeader } from "@/components/admin/page-header";
import { buttonVariants } from "@/components/ui/button";
import { requireStaff } from "@/lib/dal";
import { getAdminArticle } from "@/modules/articles/admin/queries";

export const metadata: Metadata = { title: "ویرایش مقاله" };

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;

  const article = await getAdminArticle(id);
  if (!article) notFound();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title={article.title} />
        {article.status === "PUBLISHED" ? (
          <Link href={`/blog/${article.slug}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            مشاهده در سایت
          </Link>
        ) : null}
      </div>
      <ArticleForm
        article={{
          id: article.id,
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          contentHtml: article.contentHtml,
          // JSON ذخیره‌شده را خودمان از Tiptap گرفته‌ایم؛ شکل آن JSONContent است.
          contentJson: article.contentJson as unknown as JSONContent,
          coverUrl: article.coverUrl,
          coverAlt: article.coverAlt,
          status: article.status,
          seoTitle: article.seoTitle,
          seoDescription: article.seoDescription,
        }}
      />
    </div>
  );
}
