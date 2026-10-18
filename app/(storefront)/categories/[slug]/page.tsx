import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListingSkeleton } from "@/components/catalog/listing-skeleton";
import { ProductListing } from "@/components/catalog/product-listing";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";
import { getCategoryBySlug, listCategories } from "@/modules/catalog/queries";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateStaticParams() {
  const categories = await listCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};

  return {
    title: `خرید ${category.name}`,
    description: `خرید آنلاین ${category.name} از برندهای معتبر با ضمانت اصالت کالا و ارسال سریع.`,
    alternates: { canonical: `/categories/${category.slug}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const crumbs = [
    { label: "خانه", href: "/" },
    { label: "دسته‌بندی‌ها", href: "/categories" },
    { label: category.name },
  ];

  return (
    <div className="space-y-6">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "خانه", path: "/" },
          { name: "دسته‌بندی‌ها", path: "/categories" },
          { name: category.name, path: `/categories/${category.slug}` },
        ])}
      />
      <Breadcrumbs items={crumbs} />
      <h1 className="text-2xl font-extrabold">{category.name}</h1>
      <Suspense fallback={<ListingSkeleton />}>
        <ProductListing
          searchParams={searchParams}
          basePath={`/categories/${category.slug}`}
          fixedCategory={category.slug}
        />
      </Suspense>
    </div>
  );
}
