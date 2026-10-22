import type { Metadata } from "next";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";
import { ArticleCard, formatArticleDate } from "@/components/blog/article-card";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { formatNumber } from "@/lib/format";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { getArticleBySlug, getArticleRedirectTarget, listArticleSlugs, listLatestArticles } from "@/modules/articles/queries";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const slugs = await listArticleSlugs();
  // با Cache Components، generateStaticParams نباید خالی برگردد (مثل صفحه‌ی محصول).
  if (slugs.length === 0) return [{ slug: "_" }];
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};

  const title = article.seoTitle ?? article.title;
  const description = article.seoDescription ?? article.excerpt;

  return {
    title,
    description,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/blog/${article.slug}`,
      publishedTime: article.publishedAt.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      ...(article.coverUrl && { images: [{ url: article.coverUrl, alt: article.coverAlt ?? article.title }] }),
    },
  };
}

export default async function ArticlePage({ params }: { params: Params }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    // نامک قدیمی (بعد از تغییر slug در پنل) → ریدایرکت دائمی به نامک فعلی.
    const target = await getArticleRedirectTarget(slug);
    if (target && target !== slug) permanentRedirect(`/blog/${target}`);
    notFound();
  }

  const more = await listLatestArticles(3, article.slug);

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <JsonLd
        data={articleJsonLd({
          slug: article.slug,
          title: article.seoTitle ?? article.title,
          description: article.seoDescription ?? article.excerpt,
          coverUrl: article.coverUrl,
          publishedAt: article.publishedAt,
          updatedAt: article.updatedAt,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "خانه", path: "/" },
          { name: "مقالات", path: "/blog" },
          { name: article.title, path: `/blog/${article.slug}` },
        ])}
      />

      <Breadcrumbs items={[{ label: "خانه", href: "/" }, { label: "مقالات", href: "/blog" }, { label: article.title }]} />

      <header className="space-y-3">
        <h1 className="text-3xl leading-[3rem] font-extrabold">{article.title}</h1>
        <p className="text-muted text-sm">
          <time dateTime={article.publishedAt.toISOString()}>{formatArticleDate(article.publishedAt)}</time>
          {" · "}
          مطالعه {formatNumber(article.readingMinutes)} دقیقه
        </p>
      </header>

      {article.coverUrl ? (
        <div className="bg-surface-2 relative aspect-video overflow-hidden rounded-2xl">
          <Image src={article.coverUrl} alt={article.coverAlt ?? article.title} fill priority sizes="(min-width: 768px) 768px, 100vw" className="object-cover" />
        </div>
      ) : null}

      {/* contentHtml هنگام ذخیره و بار دیگر هنگام خواندن (getArticleBySlug) با sanitizeArticleHtml پاک‌سازی شده است. */}
      <div className="rich-content" dangerouslySetInnerHTML={{ __html: article.contentHtml }} />

      {more.length > 0 ? (
        <section aria-labelledby="more-articles" className="border-border space-y-4 border-t pt-8">
          <h2 id="more-articles" className="text-xl font-extrabold">
            مقاله‌های دیگر
          </h2>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((item) => (
              <li key={item.slug}>
                <ArticleCard article={item} headingLevel={3} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
