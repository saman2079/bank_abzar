import type { Metadata } from "next";
import { BannerForm } from "@/components/admin/banner-form";
import { PageHeader } from "@/components/admin/page-header";
import { requireStaff } from "@/lib/dal";

export const metadata: Metadata = { title: "بنر جدید" };

export default async function NewBannerPage() {
  await requireStaff();

  return (
    <div className="space-y-5">
      <PageHeader title="بنر جدید" />
      <BannerForm />
    </div>
  );
}
