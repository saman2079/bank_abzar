import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { EditUserForm, ResetPasswordForm } from "@/components/admin/user-forms";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/dal";
import { formatDateTime, formatNumber, formatToman } from "@/lib/format";
import { formatOrderNumber } from "@/modules/orders/constants";
import type { OrderStatus } from "@/modules/orders/constants";
import { getAdminUser } from "@/modules/users/admin/queries";

export const metadata: Metadata = { title: "ویرایش کاربر" };

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;

  const user = await getAdminUser(id);
  if (!user) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.name ?? "بدون نام"}
        description={`${user.phone} — ${user.role === "ADMIN" ? "ادمین" : user.role === "STAFF" ? "کارمند" : "مشتری"}${user.createdByAdmin && !user.phoneVerifiedAt ? " — ثبت تلفنی (تأیید نشده)" : ""}`}
      />

      <Card className="p-5">
        <EditUserForm user={user} isSelf={user.id === admin.id} />
      </Card>

      {user.role !== "CUSTOMER" ? (
        <Card className="space-y-3 p-5">
          <h2 className="font-bold">تغییر رمز</h2>
          <ResetPasswordForm userId={user.id} />
        </Card>
      ) : null}

      <Card className="space-y-3 p-5">
        <h2 className="font-bold">آخرین سفارش‌ها</h2>
        {user.orders.length === 0 ? (
          <p className="text-muted text-sm">سفارشی ندارد.</p>
        ) : (
          <ul className="divide-border divide-y text-sm">
            {user.orders.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <Link href={`/admin/orders/${order.id}`} className="font-bold hover:underline">
                  {formatNumber(Number(formatOrderNumber(order.number)))}
                </Link>
                <OrderStatusBadge status={order.status as OrderStatus} />
                <span>{formatToman(order.total)}</span>
                <span className="text-muted">{formatDateTime(order.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
