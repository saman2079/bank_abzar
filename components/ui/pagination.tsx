import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  totalPages: number;
  basePath: string;
  /** پارامترهای فعلی URL بدون `page`؛ مقدارهای خالی/undefined نادیده گرفته می‌شوند */
  params?: Record<string, string | undefined>;
};

const WINDOW = 5;

function buildHref(
  basePath: string,
  params: Record<string, string | undefined>,
  page: number,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  if (page > 1) search.set("page", String(page));
  const queryString = search.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

function pageWindow(page: number, totalPages: number): number[] {
  const start = Math.max(1, Math.min(page - Math.floor(WINDOW / 2), totalPages - WINDOW + 1));
  const end = Math.min(totalPages, start + WINDOW - 1);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

const itemClass = "grid size-10 place-items-center rounded-full border text-sm transition-colors";

export function Pagination({ page, totalPages, basePath, params = {} }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="صفحه‌بندی" className="flex items-center justify-center gap-2">
      {page > 1 && (
        <Link
          href={buildHref(basePath, params, page - 1)}
          rel="prev"
          aria-label="صفحه قبل"
          className={cn(itemClass, "border-border hover:border-primary")}
        >
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      )}

      {pageWindow(page, totalPages).map((item) => (
        <Link
          key={item}
          href={buildHref(basePath, params, item)}
          aria-label={`صفحه ${formatNumber(item)}`}
          aria-current={item === page ? "page" : undefined}
          className={cn(
            itemClass,
            item === page
              ? "border-primary bg-primary text-primary-fg font-bold"
              : "border-border hover:border-primary",
          )}
        >
          {formatNumber(item)}
        </Link>
      ))}

      {page < totalPages && (
        <Link
          href={buildHref(basePath, params, page + 1)}
          rel="next"
          aria-label="صفحه بعد"
          className={cn(itemClass, "border-border hover:border-primary")}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Link>
      )}
    </nav>
  );
}