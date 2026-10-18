import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { requireStaff } from "@/lib/dal";
import { listBrandOptions, listCategoryOptions } from "@/modules/catalog/admin/queries";

export const metadata: Metadata = { title: "محصول جدید" };

export default async function NewProductPage() {
  await requireStaff();
  const [brands, categories] = await Promise.all([listBrandOptions(), listCategoryOptions()]);

  return (
    <div className="space-y-5">
      <PageHeader title="محصول جدید" />
      {brands.length === 0 || categories.length === 0 ? (
        <p className="text-muted text-sm">قبل از ساخت محصول، حداقل یک برند و یک دسته بسازید.</p>
      ) : (
        <ProductForm brands={brands} categories={categories} />
      )}
    </div>
  );
}
