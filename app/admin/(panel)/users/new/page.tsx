import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { CreateUserForm } from "@/components/admin/user-forms";
import { requireAdmin } from "@/lib/dal";

export const metadata: Metadata = { title: "کاربر جدید" };

export default async function NewUserPage() {
  await requireAdmin();

  return (
    <div className="space-y-5">
      <PageHeader title="کاربر جدید" />
      <CreateUserForm />
    </div>
  );
}
