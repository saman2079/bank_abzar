import type { Metadata } from "next";
import { StaticPage } from "@/components/shared/static-page";

export const metadata: Metadata = {
  title: "تماس با ما",
  description: "راه‌های ارتباط با پشتیبانی بانک ابزار.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <StaticPage title="تماس با ما">
      {/* شماره تماس، آدرس و ساعت کاری واقعی از صاحب فروشگاه گرفته شود */}
      <p>اطلاعات تماس، آدرس و ساعت کاری فروشگاه به‌زودی در این صفحه قرار می‌گیرد.</p>
    </StaticPage>
  );
}
