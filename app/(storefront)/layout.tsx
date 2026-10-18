import { BottomNav } from "@/components/layout/bottom-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-[60vh] max-w-7xl px-4 pt-6 pb-24 md:pb-0">{children}</main>
      <SiteFooter />
      <BottomNav />
    </>
  );
}
