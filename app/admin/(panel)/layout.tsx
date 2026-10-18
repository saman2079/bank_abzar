import { Suspense } from "react";
import { LogoutButton } from "@/components/account/logout-button";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireStaff } from "@/lib/dal";

async function PanelShell({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <header className="border-border flex items-center justify-between border-b pb-4">
        <p className="font-extrabold">پنل مدیریت بانک ابزار</p>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted">{user.name ?? user.phone}</span>
          <LogoutButton />
        </div>
      </header>
      <div className="grid gap-6 md:grid-cols-[200px_1fr]">
        <aside>
          <AdminNav role={user.role} />
        </aside>
        <div className="min-w-0 space-y-6">{children}</div>
      </div>
    </div>
  );
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="bg-surface-2 m-4 h-72 animate-pulse rounded-xl" />}>
      <PanelShell>{children}</PanelShell>
    </Suspense>
  );
}
