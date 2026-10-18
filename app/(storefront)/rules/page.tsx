import type { Metadata } from "next";
import { StaticPage } from "@/components/shared/static-page";

export const metadata: Metadata = {
  title: "قوانین و مقررات",
  description: "قوانین و شرایط استفاده از فروشگاه بانک ابزار.",
  alternates: { canonical: "/rules" },
};

export default function RulesPage() {
  return (
    <StaticPage title="قوانین و مقررات">
      {/* متن حقوقی نهایی (شرایط خرید، مرجوعی، حریم خصوصی) از صاحب فروشگاه تأمین شود */}
      <p>متن قوانین و مقررات، شرایط مرجوعی و حریم خصوصی پس از تأیید صاحب فروشگاه در این صفحه قرار می‌گیرد.</p>
    </StaticPage>
  );
}
