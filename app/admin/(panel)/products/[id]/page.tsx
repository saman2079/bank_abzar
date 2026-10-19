import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { ProductImagesManager } from "@/components/admin/product-images";
import { ProductForm } from "@/components/admin/product-form";
import { Card } from "@/components/ui/card";
import { requireStaff } from "@/lib/dal";
import { getAdminProduct, listBrandOptions, listCategoryOptions } from "@/modules/catalog/admin/queries";

export const metadata: Metadata = { title: "ویرایش محصول" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;

  const [product, brands, categories] = await Promise.all([getAdminProduct(id), listBrandOptions(), listCategoryOptions()]);
  if (!product) notFound();

  return (
    <div className="space-y-5">
      <PageHeader title={product.name} />
      <div className="flex flex-wrap gap-4 text-sm">
        <Link href={`/admin/inventory/${product.id}`} className="text-primary hover:underline">
          مدیریت موجودی و تاریخچه
        </Link>
        {product.status === "ACTIVE" ? (
          <Link href={`/products/${product.slug}`} className="text-primary hover:underline" target="_blank">
            مشاهده در سایت
          </Link>
        ) : null}
      </div>
      <Card className="space-y-3 p-5">
        <h2 className="font-bold">تصاویر محصول</h2>
        <ProductImagesManager productId={product.id} images={product.images} />
      </Card>
      <ProductForm product={product} brands={brands} categories={categories} />
    </div>
  );
}
