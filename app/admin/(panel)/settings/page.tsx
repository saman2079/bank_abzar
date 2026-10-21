import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { ShippingSettingsForm } from "@/components/admin/shipping-settings-form";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/dal";
import { getShippingSettings } from "@/modules/settings/queries";

export const metadata: Metadata = { title: "تنظیمات" };

export default async function AdminSettingsPage() {
  await requireAdmin();
  const shipping = await getShippingSettings();

  return (
    <div className="space-y-5">
      <PageHeader title="تنظیمات" />
      <Card className="space-y-3 p-5">
        <h2 className="font-bold">هزینه‌ی ارسال</h2>
        <ShippingSettingsForm settings={shipping} />
      </Card>
    </div>
  );
}
