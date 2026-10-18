import type { Metadata } from "next";
import { Suspense } from "react";
import { ListingSkeleton } from "@/components/catalog/listing-skeleton";
import { ProductListing } from "@/components/catalog/product-listing";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

export const metadata: Metadata = {
  title: "فروشگاه ابزارآلات",
  description: "خرید آنلاین ابزارآلات دستی و برقی از برندهای معتبر با ضمانت اصالت کالا.",
  // همه‌ی ترکیب‌های فیلتر/صفحه‌بندی به نسخه‌ی اصلی اشاره می‌کنند تا محتوای تکراری ایندکس نشود.
  alternates: { canonical: "/products" },
};

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default function ProductsPage({ searchParams }: PageProps) {
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "خانه", href: "/" }, { label: "فروشگاه" }]} />
      <h1 className="text-2xl font-extrabold">فروشگاه ابزارآلات</h1>
      <Suspense fallback={<ListingSkeleton />}>
        <ProductListing searchParams={searchParams} basePath="/products" />
      </Suspense>
    </div>
  );
}
