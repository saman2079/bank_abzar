import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "بانک ابزار | انتخاب حرفه‌ای ابزارآلات",
    template: "%s | بانک ابزار",
  },
  description:
    "فروشگاه تخصصی ابزارآلات دستی، برقی و صنعتی؛ راهنمای انتخاب ابزار مناسب برای کارهای حرفه‌ای و خانگی.",
  applicationName: "بانک ابزار",
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" dir="rtl" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
