import type { Metadata } from "next";
import { DataTable, EmptyRow, Td, Th } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/ui/pagination";
import { requireAdmin } from "@/lib/dal";
import { formatDateTime } from "@/lib/format";
import { pageParam, type RawSearchParams } from "@/lib/query-params";
import { listAuditLogs } from "@/modules/audit/queries";

export const metadata: Metadata = { title: "گزارش تغییرات" };

export default async function AuditPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  await requireAdmin();
  const page = pageParam((await searchParams).page);

  const { items, totalPages } = await listAuditLogs(page);

  return (
    <div className="space-y-5">
      <PageHeader title="گزارش تغییرات" description="ثبت فقط‌افزودنی تغییرات حساس پنل" />

      <DataTable>
        <thead>
          <tr>
            <Th>زمان</Th>
            <Th>کاربر</Th>
            <Th>عملیات</Th>
            <Th>جزئیات</Th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <EmptyRow colSpan={4}>هنوز موردی ثبت نشده است.</EmptyRow>
          ) : (
            items.map((log) => (
              <tr key={log.id}>
                <Td className="text-muted whitespace-nowrap">{formatDateTime(log.createdAt)}</Td>
                <Td>
                  {log.actorLabel ?? "—"}
                  {log.ip ? (
                    <p className="text-muted text-xs" dir="ltr">
                      {log.ip}
                    </p>
                  ) : null}
                </Td>
                <Td dir="ltr" className="text-start font-mono text-xs">
                  {log.action}
                  {log.entityId ? <p className="text-muted">{log.entity}:{log.entityId}</p> : null}
                </Td>
                <Td dir="ltr" className="text-muted max-w-sm text-start font-mono text-xs break-words">
                  {log.diff ? JSON.stringify(log.diff) : ""}
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </DataTable>

      <Pagination page={Math.min(page, totalPages)} totalPages={totalPages} basePath="/admin/audit" />
    </div>
  );
}
