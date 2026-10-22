import Image from "next/image";
import Link from "next/link";
import { Newspaper } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";
import type { ArticleSummary } from "@/modules/articles/queries";

const faDate = new Intl.DateTimeFormat("fa-IR", { dateStyle: "long", timeZone: "Asia/Tehran" });

export function formatArticleDate(date: Date): string {
  return faDate.format(date);
}

/** کارت مقاله؛ `headingLevel` برای رعایت سلسله‌مراتب عنوان‌ها (h2 در لیست، h3 در «مقاله‌های دیگر»). */
export function ArticleCard({ article, headingLevel = 2 }: { article: ArticleSummary; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <Card className="hover:border-primary overflow-hidden transition-colors">
      <Link href={`/blog/${article.slug}`} className="block">
        <div className="bg-surface-2 relative aspect-video">
          {article.coverUrl ? (
            <Image src={article.coverUrl} alt={article.coverAlt ?? article.title} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
          ) : (
            <div className="text-muted grid size-full place-items-center" aria-hidden>
              <Newspaper className="size-1/4" strokeWidth={1.25} />
            </div>
          )}
        </div>
        <div className="space-y-2 p-4">
          <Heading className="line-clamp-2 text-base leading-8 font-extrabold">{article.title}</Heading>
          <p className="text-muted line-clamp-3 text-sm leading-7">{article.excerpt}</p>
          <p className="text-muted text-xs">
            <time dateTime={article.publishedAt.toISOString()}>{formatArticleDate(article.publishedAt)}</time>
            {" · "}
            مطالعه {formatNumber(article.readingMinutes)} دقیقه
          </p>
        </div>
      </Link>
    </Card>
  );
}
