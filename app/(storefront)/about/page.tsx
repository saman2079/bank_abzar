import type { Metadata } from "next";
import { StaticPage } from "@/components/shared/static-page";

export const metadata: Metadata = {
  title: "درباره ما",
  description: "با بانک ابزار، فروشگاه اینترنتی ابزارآلات دستی و برقی بیشتر آشنا شوید.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <StaticPage title="درباره ما">
      {/* متن نهایی را صاحب فروشگاه تأمین می‌کند */}
      <p>
        بانک ابزار فروشگاه اینترنتی ابزارآلات دستی و برقی است؛ با تمرکز بر عرضه‌ی برندهای معتبر، ضمانت اصالت کالا و
        ارسال سریع به سراسر کشور.
      </p>
      <p>این صفحه با معرفی کامل فروشگاه جایگزین می‌شود.</p>
    </StaticPage>
  );
}
