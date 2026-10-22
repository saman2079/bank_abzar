import { ArticleCard } from "@/components/blog/article-card";
import { Pagination } from "@/components/ui/pagination";
import { pageParam, type RawSearchParams } from "@/lib/query-params";
import { listPublishedArticles } from "@/modules/articles/queries";

/** داخل <Suspense> استفاده شود (searchParams داده‌ی runtime است). */
export async function BlogListing({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const raw = await searchParams;
  const requested = pageParam(raw.page);
  const { items, totalPages } = await listPublishedArticles(requested);
  const page = Math.min(requested, totalPages);

  if (items.length === 0) {
    return <p className="text-muted py-10 text-center text-sm">هنوز مقاله‌ای منتشر نشده است.</p>;
  }

  return (
    <div className="space-y-8">
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((article) => (
          <li key={article.slug}>
            <ArticleCard article={article} />
          </li>
        ))}
      </ul>
      <Pagination page={page} totalPages={totalPages} basePath="/blog" />
    </div>
  );
}
