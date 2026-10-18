import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryForm } from "@/components/admin/category-form";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/dal";
import { deleteCategoryAction } from "@/modules/catalog/admin/actions";
import { getAdminCategory, listCategoryOptions } from "@/modules/catalog/admin/queries";

export const metadata: Metadata = { title: "ویرایش دسته" };

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;

  const [category, parents] = await Promise.all([getAdminCategory(id), listCategoryOptions()]);
  if (!category) notFound();

  return (
    <div className="space-y-5">
      <PageHeader title={category.name} />
      <CategoryForm category={category} parents={parents} />

      <form action={deleteCategoryAction} className="border-border border-t pt-5">
        <input type="hidden" name="id" value={category.id} />
        <Button type="submit" variant="outline" className="text-danger">
          حذف دسته
        </Button>
        <p className="text-muted mt-2 text-xs">فقط دسته‌ی خالی (بدون محصول و بدون زیردسته) حذف می‌شود.</p>
      </form>
    </div>
  );
}
