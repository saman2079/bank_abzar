import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { template: "%s | پنل بانک ابزار", default: "پنل بانک ابزار" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="bg-bg min-h-screen">{children}</div>;
}
