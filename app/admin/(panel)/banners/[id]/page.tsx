import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BannerForm } from "@/components/admin/banner-form";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/dal";
import { deleteBannerAction } from "@/modules/banners/admin/actions";
import { getAdminBanner } from "@/modules/banners/admin/queries";

export const metadata: Metadata = { title: "ویرایش بنر" };

const TEHRAN_OFFSET_MS = 3.5 * 60 * 60 * 1000;

/** مقدار `datetime-local` به وقت تهران (ایران بدون ساعت تابستانی است). */
function toTehranInput(date: Date | null): string {
  return date ? new Date(date.getTime() + TEHRAN_OFFSET_MS).toISOString().slice(0, 16) : "";
}

export default async function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;

  const banner = await getAdminBanner(id);
  if (!banner) notFound();

  return (
    <div className="space-y-5">
      <PageHeader title={banner.title} />
      <BannerForm
        banner={{
          id: banner.id,
          title: banner.title,
          subtitle: banner.subtitle,
          ctaLabel: banner.ctaLabel,
          linkUrl: banner.linkUrl,
          imageUrl: banner.imageUrl,
          mobileImageUrl: banner.mobileImageUrl,
          imageAlt: banner.imageAlt,
          isActive: banner.isActive,
          startsAt: toTehranInput(banner.startsAt),
          endsAt: toTehranInput(banner.endsAt),
        }}
      />

      <form action={deleteBannerAction} className="border-border border-t pt-5">
        <input type="hidden" name="id" value={banner.id} />
        <Button type="submit" variant="outline" className="text-danger">
          حذف بنر
        </Button>
      </form>
    </div>
  );
}
