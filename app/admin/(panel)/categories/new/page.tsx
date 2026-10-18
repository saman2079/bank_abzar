import type { Metadata } from "next";
import { CategoryForm } from "@/components/admin/category-form";
import { PageHeader } from "@/components/admin/page-header";
import { requireStaff } from "@/lib/dal";
import { listCategoryOptions } from "@/modules/catalog/admin/queries";

export const metadata: Metadata = { title: "دسته‌ی جدید" };

export default async function NewCategoryPage() {
  await requireStaff();
  const parents = await listCategoryOptions();

  return (
    <div className="space-y-5">
      <PageHeader title="دسته‌ی جدید" />
      <CategoryForm parents={parents} />
    </div>
  );
}
