"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Boxes, ClipboardList, FileText, LayoutDashboard, Newspaper, Package, ScrollText, Settings, Tags, Users, Warehouse } from "lucide-react";
import type { Role } from "@/modules/auth/constants";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "داشبورد", Icon: LayoutDashboard, adminOnly: false },
  { href: "/admin/orders", label: "سفارش‌ها", Icon: ClipboardList, adminOnly: false },
  { href: "/admin/invoices", label: "فاکتورها", Icon: FileText, adminOnly: false },
  { href: "/admin/articles", label: "مقاله‌ها", Icon: Newspaper, adminOnly: false },
  { href: "/admin/products", label: "محصولات", Icon: Package, adminOnly: false },
  { href: "/admin/categories", label: "دسته‌ها", Icon: Boxes, adminOnly: false },
  { href: "/admin/brands", label: "برندها", Icon: Tags, adminOnly: false },
  { href: "/admin/inventory", label: "انبار", Icon: Warehouse, adminOnly: false },
  { href: "/admin/users", label: "کاربران", Icon: Users, adminOnly: true },
  { href: "/admin/audit", label: "گزارش تغییرات", Icon: ScrollText, adminOnly: true },
  { href: "/admin/settings", label: "تنظیمات", Icon: Settings, adminOnly: true },
] as const;

/**
 * منوی عمودی پنل. لینک کلیک‌شده همان لحظه هایلایت می‌شود (بدون انتظار برای رسیدن صفحه‌ی جدید)؛
 * `onNavigate` برای بستن کشوی موبایل هم‌زمان با کلیک است. در دسکتاپ سایدبار ثابت و در موبایل داخل کشو است.
 */
export function AdminNav({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname();
  // مقصدِ در حال بارگذاری؛ فقط تا وقتی مسیر فعلی همان مسیرِ زمان کلیک است معتبر است (با رسیدن صفحه‌ی جدید خودبه‌خود نادیده گرفته می‌شود).
  const [pending, setPending] = useState<{ from: string; href: string } | null>(null);
  const current = pending && pending.from === pathname ? pending.href : pathname;

  return (
    <nav aria-label="منوی مدیریت" className="flex flex-col gap-2">
      {items
        .filter((item) => !item.adminOnly || role === "ADMIN")
        .map(({ href, label, Icon }) => {
          const active = href === "/admin" ? current === "/admin" : current === href || current.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              onClick={() => {
                setPending({ from: pathname, href });
                onNavigate?.();
              }}
              className={cn(
                "hover:border-primary hover:text-primary flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-colors",
                active ? "border-primary text-primary bg-primary/10 font-bold" : "border-border",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </Link>
          );
        })}
    </nav>
  );
}
