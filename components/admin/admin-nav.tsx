import Link from "next/link";
import { Boxes, ClipboardList, LayoutDashboard, Package, ScrollText, Settings, Tags, Users, Warehouse } from "lucide-react";
import type { Role } from "@/modules/auth/constants";

const items = [
  { href: "/admin", label: "داشبورد", Icon: LayoutDashboard, adminOnly: false },
  { href: "/admin/orders", label: "سفارش‌ها", Icon: ClipboardList, adminOnly: false },
  { href: "/admin/products", label: "محصولات", Icon: Package, adminOnly: false },
  { href: "/admin/categories", label: "دسته‌ها", Icon: Boxes, adminOnly: false },
  { href: "/admin/brands", label: "برندها", Icon: Tags, adminOnly: false },
  { href: "/admin/inventory", label: "انبار", Icon: Warehouse, adminOnly: false },
  { href: "/admin/users", label: "کاربران", Icon: Users, adminOnly: true },
  { href: "/admin/audit", label: "گزارش تغییرات", Icon: ScrollText, adminOnly: true },
  { href: "/admin/settings", label: "تنظیمات", Icon: Settings, adminOnly: true },
] as const;

export function AdminNav({ role }: { role: Role }) {
  return (
    <nav aria-label="منوی مدیریت" className="flex gap-2 overflow-x-auto md:flex-col">
      {items
        .filter((item) => !item.adminOnly || role === "ADMIN")
        .map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className="border-border hover:border-primary hover:text-primary flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-sm transition-colors"
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        ))}
    </nav>
  );
}
