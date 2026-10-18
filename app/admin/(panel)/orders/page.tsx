import type { Metadata } from "next";
import Link from "next/link";
import { DataTable, EmptyRow, Td, Th } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { SearchForm } from "@/components/admin/search-form";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { requireStaff } from "@/lib/dal";
import { formatDateTime, formatNumber, formatToman } from "@/lib/format";
import { firstParam, pageParam, type RawSearchParams } from "@/lib/query-params";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, formatOrderNumber } from "@/modules/orders/constants";
import { listAdminOrders } from "@/modules/orders/admin/queries";

export const metadata: Metadata = { title: "سفارش‌ها" };

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  await requireStaff();
  const raw = await searchParams;

  const q = firstParam(raw.q)?.trim().slice(0, 60) || undefined;
  const statusRaw = firstParam(raw.status);
  const status = ORDER_STATUSES.find((item) => item === statusRaw);
  const page = pageParam(raw.page);

  const { items, total, totalPages } = await listAdminOrders({ status, q, page });

  return (
    <div className="space-y-5">
      <PageHeader title="سفارش‌ها" description={`${formatNumber(total)} سفارش`} />

      <SearchForm action="/admin/orders" q={q} placeholder="شماره سفارش، موبایل یا نام مشتری…">
        <div className="w-48">
          <Select name="status" defaultValue={status ?? ""} aria-label="وضعیت">
            <option value="">همه‌ی وضعیت‌ها</option>
            {ORDER_STATUSES.map((item) => (
              <option key={item} value={item}>
                {ORDER_STATUS_LABELS[item]}
              </option>
            ))}
          </Select>
        </div>
      </SearchForm>

      <DataTable>
        <thead>
          <tr>
            <Th>سفارش</Th>
            <Th>مشتری</Th>
            <Th>وضعیت</Th>
            <Th>مبلغ</Th>
            <Th>زمان</Th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <EmptyRow colSpan={5}>سفارشی پیدا نشد.</EmptyRow>
          ) : (
            items.map((order) => (
              <tr key={order.id}>
                <Td>
                  <Link href={`/admin/orders/${order.id}`} className="font-bold hover:underline">
                    {formatNumber(Number(formatOrderNumber(order.number)))}
                  </Link>
                </Td>
                <Td>
                  {order.user.name ?? "—"}
                  <p className="text-muted text-xs" dir="ltr">
                    {order.user.phone}
                  </p>
                </Td>
                <Td>
                  <OrderStatusBadge status={order.status} />
                </Td>
                <Td>{formatToman(order.total)}</Td>
                <Td className="text-muted whitespace-nowrap">{formatDateTime(order.createdAt)}</Td>
              </tr>
            ))
          )}
        </tbody>
      </DataTable>

      <Pagination page={Math.min(page, totalPages)} totalPages={totalPages} basePath="/admin/orders" params={{ q, status }} />
    </div>
  );
}
