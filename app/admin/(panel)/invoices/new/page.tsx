import type { Metadata } from "next";
import { InvoiceForm } from "@/components/admin/invoice-form";
import { PageHeader } from "@/components/admin/page-header";
import { requireStaff } from "@/lib/dal";
import { listInvoiceProducts } from "@/modules/invoices/queries";

export const metadata: Metadata = { title: "صدور فاکتور" };

export default async function NewInvoicePage() {
  await requireStaff();
  const products = await listInvoiceProducts();

  return (
    <div className="space-y-5">
      <PageHeader
        title="صدور فاکتور"
        description="برای سفارش‌های خارج از سایت: اول پیش‌فاکتور بدهید و بعد از تأیید مشتری قطعی کنید، یا مستقیم فاکتور قطعی صادر کنید."
      />
      {products.length === 0 ? <p className="text-muted text-sm">کالای فعالی برای فاکتور وجود ندارد.</p> : <InvoiceForm products={products} />}
    </div>
  );
}
