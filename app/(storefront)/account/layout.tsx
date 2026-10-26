import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountNav } from "@/components/account/account-nav";
import { LogoutButton } from "@/components/account/logout-button";
import { requireUser } from "@/lib/dal";

export const metadata: Metadata = {
  title: { template: "%s | حساب کاربری", default: "حساب کاربری" },
  robots: { index: false, follow: false },
};

async function AccountShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/account");
  const initial = (user.name?.trim() || "؟").charAt(0);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-[250px_minmax(0,1fr)] md:gap-8">
      <aside className="min-w-0 space-y-4 md:sticky md:top-24 md:self-start">
        <div className="border-border bg-surface rounded-card flex items-center gap-3 border p-4">
          <span
            aria-hidden
            className="bg-primary text-primary-fg grid size-12 shrink-0 place-items-center rounded-full text-lg font-extrabold"
          >
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{user.name ?? "کاربر بانک ابزار"}</p>
            <p className="text-muted text-xs" dir="ltr">
              {user.phone}
            </p>
          </div>
          <LogoutButton className="shrink-0" />
        </div>

        <AccountNav />
      </aside>

      <section className="min-w-0">{children}</section>
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
