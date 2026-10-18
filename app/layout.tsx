import type { Metadata, Viewport } from "next";
import "@fontsource-variable/vazirmatn";
import "./globals.css";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: "بانک ابزار | فروشگاه اینترنتی ابزارآلات دستی و برقی",
    template: "%s | بانک ابزار",
  },
  description:
    "خرید آنلاین ابزارآلات دستی، برقی و تجهیزات ایمنی از برندهای معتبر جهانی با ضمانت اصالت کالا و ارسال سریع به سراسر کشور.",
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: "بانک ابزار",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0d14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="bg-bg text-fg font-sans antialiased">{children}</body>
    </html>
  );
}