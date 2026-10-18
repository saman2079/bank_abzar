import type { Metadata } from "next";
import Link from "next/link";
import { DataTable, EmptyRow, Td, Th } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { SearchForm } from "@/components/admin/search-form";
import { Pagination } from "@/components/ui/pagination";
import { requireStaff } from "@/lib/dal";
import { formatNumber } from "@/lib/format";
import { firstParam, pageParam, type RawSearchParams } from "@/lib/query-params";
import { listAdminProducts } from "@/modules/catalog/admin/queries";
import { listLowStock } from "@/modules/inventory/queries";

export const metadata: Metadata = { title: "انبار" };

export default async function InventoryPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  await requireStaff();
  const raw = await searchParams;

  const q = firstParam(raw.q)?.trim().slice(0, 100) || undefined;
  const page = pageParam(raw.page);

  const [low, list] = await Promise.all([listLowStock(20), listAdminProducts({ q, page })]);

  return (
    <div className="space-y-6">
      <PageHeader title="انبار" description="برای تغییر موجودی روی محصول بزنید." />

      {low.length > 0 ? (
        <section className="border-danger/50 rounded-card space-y-2 border p-4">
          <h2 className="text-danger font-bold">کمبود موجودی ({formatNumber(low.length)})</h2>
          <ul className="grid gap-1 text-sm sm:grid-cols-2">
            {low.map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
                <Link href={`/admin/inventory/${item.id}`} className="hover:underline">
                  {item.name}
                </Link>
                <span className="text-danger font-bold">{formatNumber(item.stock)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <SearchForm action="/admin/inventory" q={q} placeholder="نام، SKU یا برند…" />

      <DataTable>
        <thead>
          <tr>
            <Th>محصول</Th>
            <Th>SKU</Th>
            <Th>موجودی</Th>
          </tr>
        </thead>
        <tbody>
          {list.items.length === 0 ? (
            <EmptyRow colSpan={3}>محصولی پیدا نشد.</EmptyRow>
          ) : (
            list.items.map((product) => (
              <tr key={product.id}>
                <Td>
                  <Link href={`/admin/inventory/${product.id}`} className="font-bold hover:underline">
                    {product.name}
                  </Link>
                </Td>
                <Td className="text-muted" dir="ltr">
                  {product.sku}
                </Td>
                <Td>
                  <span className={product.stock <= product.lowStockThreshold ? "text-danger font-bold" : undefined}>
                    {formatNumber(product.stock)}
                  </span>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </DataTable>

      <Pagination page={Math.min(page, list.totalPages)} totalPages={list.totalPages} basePath="/admin/inventory" params={{ q }} />
    </div>
  );
}
