import type { Metadata } from "next";
import Link from "next/link";
import { DataTable, EmptyRow, Td, Th } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { SearchForm } from "@/components/admin/search-form";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { requireAdmin } from "@/lib/dal";
import { formatDateTime, formatNumber } from "@/lib/format";
import { firstParam, pageParam, type RawSearchParams } from "@/lib/query-params";
import { USER_ROLES, listAdminUsers } from "@/modules/users/admin/queries";

export const metadata: Metadata = { title: "کاربران" };

const ROLE_LABELS = { CUSTOMER: "مشتری", STAFF: "کارمند", ADMIN: "ادمین" } as const;

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  await requireAdmin();
  const raw = await searchParams;

  const q = firstParam(raw.q)?.trim().slice(0, 60) || undefined;
  const role = USER_ROLES.find((item) => item === firstParam(raw.role));
  const page = pageParam(raw.page);

  const { items, total, totalPages } = await listAdminUsers({ q, role, page });

  return (
    <div className="space-y-5">
      <PageHeader
        title="کاربران"
        description={`${formatNumber(total)} کاربر`}
        action={{ href: "/admin/users/new", label: "کاربر جدید" }}
      />

      <SearchForm action="/admin/users" q={q} placeholder="موبایل یا نام…">
        <div className="w-40">
          <Select name="role" defaultValue={role ?? ""} aria-label="نقش">
            <option value="">همه‌ی نقش‌ها</option>
            {USER_ROLES.map((item) => (
              <option key={item} value={item}>
                {ROLE_LABELS[item]}
              </option>
            ))}
          </Select>
        </div>
      </SearchForm>

      <DataTable>
        <thead>
          <tr>
            <Th>کاربر</Th>
            <Th>نقش</Th>
            <Th>سفارش</Th>
            <Th>وضعیت</Th>
            <Th>عضویت</Th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <EmptyRow colSpan={5}>کاربری پیدا نشد.</EmptyRow>
          ) : (
            items.map((user) => (
              <tr key={user.id}>
                <Td>
                  <Link href={`/admin/users/${user.id}`} className="font-bold hover:underline">
                    {user.name ?? "بدون نام"}
                  </Link>
                  <p className="text-muted text-xs" dir="ltr">
                    {user.phone}
                  </p>
                </Td>
                <Td>
                  {ROLE_LABELS[user.role]}
                  {user.createdByAdmin ? <span className="text-muted text-xs"> (تلفنی)</span> : null}
                </Td>
                <Td>{formatNumber(user._count.orders)}</Td>
                <Td>{user.isActive ? <Badge tone="primary">فعال</Badge> : <Badge tone="danger">غیرفعال</Badge>}</Td>
                <Td className="text-muted whitespace-nowrap">{formatDateTime(user.createdAt)}</Td>
              </tr>
            ))
          )}
        </tbody>
      </DataTable>

      <Pagination page={Math.min(page, totalPages)} totalPages={totalPages} basePath="/admin/users" params={{ q, role }} />
    </div>
  );
}