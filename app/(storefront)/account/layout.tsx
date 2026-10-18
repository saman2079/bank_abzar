import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LogoutButton } from "@/components/account/logout-button";
import { requireUser } from "@/lib/dal";

export const metadata: Metadata = {
  title: { template: "%s | حساب کاربری", default: "حساب کاربری" },
  robots: { index: false, follow: false },
};

const links = [
  { href: "/account", label: "پروفایل" },
  { href: "/account/orders", label: "سفارش‌ها" },
  { href: "/account/addresses", label: "آدرس‌ها" },
] as const;

async function AccountShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/account");

  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr]">
      <aside className="space-y-4">
        <p className="text-muted text-sm">
          {user.name ?? "کاربر"} · <bdi dir="ltr">{user.phone}</bdi>
        </p>
        <nav aria-label="منوی حساب" className="flex gap-2 md:flex-col">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="border-border hover:border-primary hover:text-primary rounded-xl border px-4 py-2 text-sm transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <LogoutButton />
      </aside>
      <section>{children}</section>
    </div>
  );
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="bg-surface-2 rounded-card h-72 animate-pulse" />}>
      <AccountShell>{children}</AccountShell>
    </Suspense>
  );
}
