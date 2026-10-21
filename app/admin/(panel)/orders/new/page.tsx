import type { Metadata } from "next";
import { ManualOrderForm } from "@/components/admin/manual-order-form";
import { PageHeader } from "@/components/admin/page-header";
import { requireStaff } from "@/lib/dal";
import { listOrderableProducts } from "@/modules/orders/admin/queries";

export const metadata: Metadata = { title: "ثبت سفارش دستی" };

export default async function NewManualOrderPage() {
  await requireStaff();
  const products = await listOrderableProducts();

  return (
    <div className="space-y-5">
      <PageHeader title="ثبت سفارش دستی" description="برای مشتری تلفنی یا حضوری؛ موجودی همزمان کسر می‌شود." />
      {products.length === 0 ? (
        <p className="text-muted text-sm">کالای فعال و موجودی برای سفارش وجود ندارد.</p>
      ) : (
        <ManualOrderForm products={products} />
      )}
    </div>
  );
}
