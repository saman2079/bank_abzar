import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DataTable, EmptyRow, Td, Th } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { StockAdjustForm } from "@/components/admin/stock-adjust-form";
import { Card } from "@/components/ui/card";
import { requireStaff } from "@/lib/dal";
import { formatDateTime, formatNumber } from "@/lib/format";
import { STOCK_MOVEMENT_LABELS } from "@/modules/inventory/constants";
import { formatInvoiceNumber } from "@/modules/invoices/constants";
import { getInventoryProduct, listStockMovements } from "@/modules/inventory/queries";
import { formatOrderNumber } from "@/modules/orders/constants";

export const metadata: Metadata = { title: "موجودی محصول" };

export default async function InventoryProductPage({ params }: { params: Promise<{ productId: string }> }) {
  await requireStaff();
  const { productId } = await params;

  const [product, movements] = await Promise.all([getInventoryProduct(productId), listStockMovements(productId)]);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={product.name} description={`SKU: ${product.sku}`} />

      <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="text-muted text-sm">موجودی فعلی</p>
          <p className="text-3xl font-extrabold">{formatNumber(product.stock)}</p>
        </div>
        <Link href={`/admin/products/${product.id}`} className="text-primary text-sm hover:underline">
          ویرایش محصول
        </Link>
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="font-bold">ثبت تغییر موجودی</h2>
        <StockAdjustForm productId={product.id} />
      </Card>

      <section className="space-y-3">
        <h2 className="font-bold">تاریخچه (۵۰ مورد آخر)</h2>
        <DataTable>
          <thead>
            <tr>
              <Th>زمان</Th>
              <Th>نوع</Th>
              <Th>تغییر</Th>
              <Th>توسط</Th>
              <Th>توضیح</Th>
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 ? (
              <EmptyRow colSpan={5}>سابقه‌ای نیست.</EmptyRow>
            ) : (
              movements.map((movement) => (
                <tr key={movement.id}>
                  <Td className="text-muted whitespace-nowrap">{formatDateTime(movement.createdAt)}</Td>
                  <Td>{STOCK_MOVEMENT_LABELS[movement.type]}</Td>
                  <Td dir="ltr" className={movement.delta < 0 ? "text-danger font-bold" : "text-success font-bold"}>
                    {movement.delta > 0 ? `+${movement.delta}` : movement.delta}
                  </Td>
                  <Td className="text-muted">{movement.actor}</Td>
                  <Td className="text-muted">
                    {movement.order ? (
                      <Link href={`/admin/orders/${movement.order.id}`} className="text-primary hover:underline">
                        سفارش {formatNumber(Number(formatOrderNumber(movement.order.number)))}
                      </Link>
                    ) : movement.invoice ? (
                      <Link href={`/admin/invoices/${movement.invoice.id}`} className="text-primary hover:underline">
                        فاکتور {formatNumber(Number(formatInvoiceNumber(movement.invoice.number)))}
                      </Link>
                    ) : (
                      (movement.note ?? "—")
                    )}
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </DataTable>
      </section>
    </div>
  );
}
