import type { Metadata } from "next";
import { BrandForm } from "@/components/admin/brand-form";
import { PageHeader } from "@/components/admin/page-header";
import { requireStaff } from "@/lib/dal";

export const metadata: Metadata = { title: "برند جدید" };

export default async function NewBrandPage() {
  await requireStaff();

  return (
    <div className="space-y-5">
      <PageHeader title="برند جدید" />
      <BrandForm />
    </div>
  );
}
