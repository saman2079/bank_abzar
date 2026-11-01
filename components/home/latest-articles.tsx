import { ArticleCard } from "@/components/blog/article-card";
import { SectionHeader } from "@/components/home/section-header";
import type { ArticleSummary } from "@/modules/articles/queries";

/** «مقالات تازه»؛ لینک داخلی به وبلاگ برای سئو. بدون مقاله منتشرشده چیزی رندر نمی‌شود. */
export function LatestArticles({ articles }: { articles: ArticleSummary[] }) {
  if (articles.length === 0) return null;

  return (
    <section aria-labelledby="articles-title" className="space-y-5">
      <SectionHeader id="articles-title" title="مقالات و راهنمای خرید" subtitle="قبل از خرید بخوانید" href="/blog" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} headingLevel={3} />
        ))}
      </div>
    </section>
  );
}
