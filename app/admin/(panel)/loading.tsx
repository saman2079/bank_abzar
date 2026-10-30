import { Skeleton } from "@/components/ui/skeleton";

/**
 * اسکلت فوری هنگام جابه‌جایی بین صفحات پنل: چون صفحه‌ها داده‌ی زنده از DB می‌خوانند، بدون این فایل
 * کلیک تا رسیدن پاسخ سرور هیچ واکنشی نشان نمی‌داد. این اسکلت همراه prefetch لینک‌ها از قبل در مرورگر است
 * و سایدبار/هدر پنل (لی‌اوت) سر جایش می‌ماند.
 */
export default function PanelLoading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="در حال بارگذاری">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-11 w-full max-w-md" />
      <Skeleton className="h-80 w-full" />
    </div>
  );
}
