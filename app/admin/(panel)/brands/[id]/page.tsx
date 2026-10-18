import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrandForm } from "@/components/admin/brand-form";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/dal";
import { deleteBrandAction } from "@/modules/catalog/admin/actions";
import { getAdminBrand } from "@/modules/catalog/admin/queries";

export const metadata: Metadata = { title: "ویرایش برند" };

export default async function EditBrandPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;

  const brand = await getAdminBrand(id);
  if (!brand) notFound();

  return (
    <div className="space-y-5">
      <PageHeader title={brand.name} />
      <BrandForm brand={brand} />

      <form action={deleteBrandAction} className="border-border border-t pt-5">
        <input type="hidden" name="id" value={brand.id} />
        <Button type="submit" variant="outline" className="text-danger">
          حذف برند
        </Button>
        <p className="text-muted mt-2 text-xs">فقط برندِ بدون محصول حذف می‌شود.</p>
      </form>
    </div>
  );
}
