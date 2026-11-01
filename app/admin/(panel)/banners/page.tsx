import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";
import { DataTable, EmptyRow, Td, Th } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/dal";
import { formatDateTime } from "@/lib/format";
import { MAX_ACTIVE_BANNERS } from "@/modules/banners/constants";
import { listAdminBanners } from "@/modules/banners/admin/queries";
import { moveBannerAction, toggleBannerAction } from "@/modules/banners/admin/actions";

export const metadata: Metadata = { title: "بنرها" };

export default async function AdminBannersPage() {
  await requireStaff();
  const banners = await listAdminBanners();
  const now = new Date();
  const activeCount = banners.filter((b) => b.isActive).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="بنرهای صفحه‌ی اول"
        description={`فقط بنرهای فعال در اسلایدر نمایش داده می‌شوند (حداکثر ${MAX_ACTIVE_BANNERS}). با یک بنر فعال، اسلایدر به بنر ثابت تبدیل می‌شود و با صفر بنر فعال، بنر پیش‌فرض سایت نمایش داده می‌شود.`}
        action={{ href: "/admin/banners/new", label: "بنر جدید" }}
      />
      <DataTable>
        <thead>
          <tr>
            <Th>ترتیب</Th>
            <Th>بنر</Th>
            <Th>وضعیت</Th>
            <Th>زمان‌بندی</Th>
            <Th>عملیات</Th>
          </tr>
        </thead>
        <tbody>
          {banners.length === 0 ? (
            <EmptyRow colSpan={5}>بنری ثبت نشده است؛ تا آن موقع بنر پیش‌فرض سایت نمایش داده می‌شود.</EmptyRow>
          ) : (
            banners.map((banner, index) => {
              const scheduledOut =
                banner.isActive && ((banner.startsAt && banner.startsAt > now) || (banner.endsAt && banner.endsAt <= now));
              return (
                <tr key={banner.id}>
                  <Td>
                    <div className="flex gap-1">
                      <form action={moveBannerAction}>
                        <input type="hidden" name="id" value={banner.id} />
                        <input type="hidden" name="direction" value="up" />
                        <Button type="submit" variant="outline" size="sm" disabled={index === 0} aria-label="انتقال به بالا">
                          <ArrowUp className="size-4" aria-hidden />
                        </Button>
                      </form>
                      <form action={moveBannerAction}>
                        <input type="hidden" name="id" value={banner.id} />
                        <input type="hidden" name="direction" value="down" />
                        <Button type="submit" variant="outline" size="sm" disabled={index === banners.length - 1} aria-label="انتقال به پایین">
                          <ArrowDown className="size-4" aria-hidden />
                        </Button>
                      </form>
                    </div>
                  </Td>
                  <Td>
                    <Link href={`/admin/banners/${banner.id}`} className="flex items-center gap-3 font-bold hover:underline">
                      {banner.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- بندانگشتی پنل
                        <img src={banner.imageUrl} alt="" className="border-border h-10 w-20 rounded-lg border object-cover" />
                      ) : (
                        <span className="bg-surface-2 text-muted grid h-10 w-20 place-items-center rounded-lg text-[10px]">بدون تصویر</span>
                      )}
                      {banner.title}
                    </Link>
                  </Td>
                  <Td>
                    {banner.isActive ? <Badge tone={scheduledOut ? "neutral" : "primary"}>{scheduledOut ? "فعال (خارج از بازه)" : "فعال"}</Badge> : <Badge>غیرفعال</Badge>}
                  </Td>
                  <Td className="text-muted text-xs">
                    {banner.startsAt || banner.endsAt
                      ? `${banner.startsAt ? formatDateTime(banner.startsAt) : "—"} تا ${banner.endsAt ? formatDateTime(banner.endsAt) : "—"}`
                      : "همیشه"}
                  </Td>
                  <Td>
                    <form action={toggleBannerAction}>
                      <input type="hidden" name="id" value={banner.id} />
                      <Button type="submit" variant="outline" size="sm">
                        {banner.isActive ? "غیرفعال کن" : "فعال کن"}
                      </Button>
                    </form>
                  </Td>
                </tr>
              );
            })
          )}
        </tbody>
      </DataTable>
      <p className="text-muted text-xs">{activeCount} بنر فعال</p>
    </div>
  );
}
