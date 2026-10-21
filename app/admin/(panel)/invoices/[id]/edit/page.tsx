import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { InvoiceForm, type InvoiceFormInitial } from "@/components/admin/invoice-form";
import { PageHeader } from "@/components/admin/page-header";
import { requireStaff } from "@/lib/dal";
import { formatNumber } from "@/lib/format";
import { formatInvoiceNumber } from "@/modules/invoices/constants";
import { getInvoice, listInvoiceProducts } from "@/modules/invoices/queries";

export const metadata: Metadata = { title: "ویرایش پیش‌فاکتور" };

const DAY_MS = 86_400_000;

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;

  const [invoice, activeProducts] = await Promise.all([getInvoice(id), listInvoiceProducts()]);
  if (!invoice) notFound();
  // فقط پیش‌فاکتور ویرایش می‌شود؛ فاکتور قطعی/باطل را باید ابطال و دوباره صادر کرد.
  if (invoice.status !== "PROFORMA") redirect(`/admin/invoices/${invoice.id}`);

  // کالایی که بعداً بایگانی شده هم باید در انتخابگر دیده شود.
  const known = new Set(activeProducts.map((product) => product.id));
  const extra = invoice.items
    .filter((item) => !known.has(item.productId))
    .map((item) => ({ id: item.productId, name: item.nameSnapshot, sku: item.skuSnapshot, price: item.unitPrice, stock: 0 }));

  const initial: InvoiceFormInitial = {
    id: invoice.id,
    customerName: invoice.customerName,
    customerPhone: invoice.customerPhone ?? "",
    customerAddress: invoice.customerAddress ?? "",
    lines: invoice.items.map((item) => ({ productId: item.productId, quantity: item.quantity, unitPrice: item.unitPrice, discount: item.discount })),
    discount: invoice.discount,
    taxPercent: invoice.taxPercent,
    shippingCost: invoice.shippingCost,
    validDays: invoice.validUntil ? String(Math.max(1, Math.round((invoice.validUntil.getTime() - invoice.createdAt.getTime()) / DAY_MS))) : "",
    note: invoice.note ?? "",
    paymentNote: invoice.paymentNote ?? "",
  };

  return (
    <div className="space-y-5">
      <PageHeader title={`ویرایش پیش‌فاکتور ${formatNumber(Number(formatInvoiceNumber(invoice.number)))}`} />
      <InvoiceForm products={[...activeProducts, ...extra]} initial={initial} />
    </div>
  );
}
