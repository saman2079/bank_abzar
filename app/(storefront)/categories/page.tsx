import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { listCategories } from "@/modules/catalog/queries";

export const metadata: Metadata = {
  title: "دسته‌بندی محصولات",
  description: "دسته‌بندی کامل ابزارآلات دستی، برقی، ایمنی و لوازم جانبی.",
  alternates: { canonical: "/categories" },
};

export default async function CategoriesPage() {
  const categories = await listCategories();

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "خانه", href: "/" }, { label: "دسته‌بندی‌ها" }]} />
      <h1 className="text-2xl font-extrabold">دسته‌بندی محصولات</h1>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {categories.map((category) => (
          <li key={category.slug}>
            <Link
              href={`/categories/${category.slug}`}
              className="border-border bg-surface hover:border-primary block rounded-card border p-6 text-center font-bold transition-colors"
            >
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
