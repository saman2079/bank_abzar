import type { Metadata } from "next";
import { Suspense } from "react";
import { BlogListing } from "@/components/blog/blog-listing";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { Skeleton } from "@/components/ui/skeleton";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "مقالات و راهنمای خرید ابزار",
  description: "راهنمای خرید و استفاده از ابزارآلات دستی و برقی، مقایسه‌ی ابزار و نکته‌های کاربردی کارگاهی از تیم بانک ابزار.",
  // صفحه‌ی ۲ به بعد هم به نسخه‌ی اصلی اشاره می‌کنند؛ مقاله‌ها از طریق sitemap و لینک داخلی کشف می‌شوند.
  alternates: { canonical: "/blog" },
};

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default function BlogPage({ searchParams }: PageProps) {
  return (
    <div className="space-y-6">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "خانه", path: "/" },
          { name: "مقالات", path: "/blog" },
        ])}
      />
      <Breadcrumbs items={[{ label: "خانه", href: "/" }, { label: "مقالات" }]} />
      <h1 className="text-2xl font-extrabold">مقالات و راهنمای خرید</h1>
      <Suspense
        fallback={
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-64 rounded-2xl" />
            ))}
          </div>
        }
      >
        <BlogListing searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
