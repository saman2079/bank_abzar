import type { Metadata } from "next";
import Link from "next/link";
import { DataTable, EmptyRow, Td, Th } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { requireStaff } from "@/lib/dal";
import { formatNumber } from "@/lib/format";
import { listAdminCategories } from "@/modules/catalog/admin/queries";

export const metadata: Metadata = { title: "دسته‌ها" };

export default async function AdminCategoriesPage() {
  await requireStaff();
  const categories = await listAdminCategories();

  return (
    <div className="space-y-5">
      <PageHeader title="دسته‌بندی‌ها" action={{ href: "/admin/categories/new", label: "دسته‌ی جدید" }} />
      <DataTable>
        <thead>
          <tr>
            <Th>نام</Th>
            <Th>والد</Th>
            <Th>محصولات</Th>
            <Th>ترتیب</Th>
            <Th>وضعیت</Th>
          </tr>
        </thead>
        <tbody>
          {categories.length === 0 ? (
            <EmptyRow colSpan={5}>دسته‌ای ثبت نشده است.</EmptyRow>
          ) : (
            categories.map((category) => (
              <tr key={category.id}>
                <Td>
                  <Link href={`/admin/categories/${category.id}`} className="font-bold hover:underline">
                    {category.name}
                  </Link>
                  <p className="text-muted text-xs" dir="ltr">
                    {category.slug}
                  </p>
                </Td>
                <Td className="text-muted">{category.parent?.name ?? "—"}</Td>
                <Td>{formatNumber(category._count.products)}</Td>
                <Td>{formatNumber(category.sortOrder)}</Td>
                <Td>
                  <Badge tone={category.isActive ? "primary" : "neutral"}>{category.isActive ? "فعال" : "غیرفعال"}</Badge>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </DataTable>
    </div>
  );
}
