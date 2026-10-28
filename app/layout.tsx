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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e9f0f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
  width: "device-width",
  initialScale: 1,
};

/** قبل از اولین رنگ‌آمیزی تم را می‌گذارد (جلوگیری از چشمک): انتخاب ذخیره‌شده، وگرنه تم سیستم. */
const THEME_SCRIPT = `(function(){var t="light";try{var s=localStorage.getItem("theme");t=s==="light"||s==="dark"?s:matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}catch(e){}document.documentElement.dataset.theme=t})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="bg-bg text-fg font-sans antialiased">{children}</body>
    </html>
  );
}
