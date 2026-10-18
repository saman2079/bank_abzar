import type { Metadata } from "next";
import Link from "next/link";
import { DataTable, EmptyRow, Td, Th } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { SearchForm } from "@/components/admin/search-form";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { requireStaff } from "@/lib/dal";
import { formatNumber, formatToman } from "@/lib/format";
import { firstParam, pageParam, type RawSearchParams } from "@/lib/query-params";
import { PRODUCT_STATUSES, PRODUCT_STATUS_LABELS } from "@/modules/catalog/admin/constants";
import { listAdminProducts } from "@/modules/catalog/admin/queries";

export const metadata: Metadata = { title: "محصولات" };

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  await requireStaff();
  const raw = await searchParams;

  const q = firstParam(raw.q)?.trim().slice(0, 100) || undefined;
  const statusRaw = firstParam(raw.status);
  const status = PRODUCT_STATUSES.find((item) => item === statusRaw);
  const page = pageParam(raw.page);

  const { items, total, totalPages } = await listAdminProducts({ q, status, page });

  return (
    <div className="space-y-5">
      <PageHeader title="محصولات" description={`${formatNumber(total)} محصول`} action={{ href: "/admin/products/new", label: "محصول جدید" }} />

      <SearchForm action="/admin/products" q={q} placeholder="نام، SKU یا برند…">
        <div className="w-44">
          <Select name="status" defaultValue={status ?? ""} aria-label="وضعیت">
            <option value="">همه‌ی وضعیت‌ها</option>
            {PRODUCT_STATUSES.map((item) => (
              <option key={item} value={item}>
                {PRODUCT_STATUS_LABELS[item]}
              </option>
            ))}
          </Select>
        </div>
      </SearchForm>

      <DataTable>
        <thead>
          <tr>
            <Th>محصول</Th>
            <Th>دسته / برند</Th>
            <Th>قیمت</Th>
            <Th>موجودی</Th>
            <Th>وضعیت</Th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <EmptyRow colSpan={5}>محصولی پیدا نشد.</EmptyRow>
          ) : (
            items.map((product) => (
              <tr key={product.id}>
                <Td>
                  <Link href={`/admin/products/${product.id}`} className="font-bold hover:underline">
                    {product.name}
                  </Link>
                  <p className="text-muted text-xs" dir="ltr">
                    {product.sku}
                  </p>
                </Td>
                <Td className="text-muted">
                  {product.category.name} / {product.brand.name}
                </Td>
                <Td>{formatToman(product.price)}</Td>
                <Td>
                  <span className={product.stock <= product.lowStockThreshold ? "text-danger font-bold" : undefined}>
                    {formatNumber(product.stock)}
                  </span>
                </Td>
                <Td>
                  <Badge tone={product.status === "ACTIVE" ? "primary" : "neutral"}>{PRODUCT_STATUS_LABELS[product.status]}</Badge>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </DataTable>

      <Pagination page={Math.min(page, totalPages)} totalPages={totalPages} basePath="/admin/products" params={{ q, status }} />
    </div>
  );
}
