import type { Metadata } from "next";
import Link from "next/link";
import { DataTable, EmptyRow, Td, Th } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { SearchForm } from "@/components/admin/search-form";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { requireStaff } from "@/lib/dal";
import { formatDateTime, formatNumber, formatToman } from "@/lib/format";
import { firstParam, pageParam, type RawSearchParams } from "@/lib/query-params";
import { INVOICE_STATUSES, INVOICE_STATUS_LABELS, formatInvoiceNumber } from "@/modules/invoices/constants";
import { listInvoices } from "@/modules/invoices/queries";

export const metadata: Metadata = { title: "فاکتورها" };

export default async function AdminInvoicesPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  await requireStaff();
  const raw = await searchParams;

  const q = firstParam(raw.q)?.trim().slice(0, 60) || undefined;
  const statusRaw = firstParam(raw.status);
  const status = INVOICE_STATUSES.find((item) => item === statusRaw);
  const page = pageParam(raw.page);

  const { items, total, totalPages } = await listInvoices({ status, q, page });

  return (
    <div className="space-y-5">
      <PageHeader
        title="فاکتورها"
        description={`${formatNumber(total)} فاکتور و پیش‌فاکتور`}
        action={{ href: "/admin/invoices/new", label: "صدور فاکتور جدید" }}
      />

      <SearchForm action="/admin/invoices" q={q} placeholder="شماره فاکتور، نام یا موبایل مشتری…">
        <div className="w-48">
          <Select name="status" defaultValue={status ?? ""} aria-label="وضعیت">
            <option value="">همه‌ی وضعیت‌ها</option>
            {INVOICE_STATUSES.map((item) => (
              <option key={item} value={item}>
                {INVOICE_STATUS_LABELS[item]}
              </option>
            ))}
          </Select>
        </div>
      </SearchForm>

      <DataTable>
        <thead>
          <tr>
            <Th>شماره</Th>
            <Th>مشتری</Th>
            <Th>وضعیت</Th>
            <Th>مبلغ</Th>
            <Th>زمان</Th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <EmptyRow colSpan={5}>فاکتوری پیدا نشد.</EmptyRow>
          ) : (
            items.map((invoice) => (
              <tr key={invoice.id}>
                <Td>
                  <Link href={`/admin/invoices/${invoice.id}`} className="font-bold hover:underline">
                    {formatNumber(Number(formatInvoiceNumber(invoice.number)))}
                  </Link>
                </Td>
                <Td>
                  {invoice.customerName}
                  {invoice.customerPhone ? (
                    <p className="text-muted text-xs" dir="ltr">
                      {invoice.customerPhone}
                    </p>
                  ) : null}
                </Td>
                <Td>
                  <InvoiceStatusBadge status={invoice.status} />
                </Td>
                <Td>{formatToman(invoice.total)}</Td>
                <Td className="text-muted whitespace-nowrap">{formatDateTime(invoice.createdAt)}</Td>
              </tr>
            ))
          )}
        </tbody>
      </DataTable>

      <Pagination page={Math.min(page, totalPages)} totalPages={totalPages} basePath="/admin/invoices" params={{ q, status }} />
    </div>
  );
}
