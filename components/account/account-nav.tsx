"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, MapPin, Package, User } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/account", label: "پروفایل", Icon: User, exact: true },
  { href: "/account/orders", label: "سفارش‌ها", Icon: Package, exact: false },
  { href: "/account/wishlist", label: "علاقه‌مندی‌ها", Icon: Heart, exact: false },
  { href: "/account/addresses", label: "آدرس‌ها", Icon: MapPin, exact: false },
] as const;

/** موبایل: نوار افقی قابل‌اسکرول؛ دسکتاپ: منوی عمودی. آیتم فعال با زرد مشخص است. */
export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="منوی حساب"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-col md:gap-1 md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden"
    >
      {links.map(({ href, label, Icon, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap transition-colors md:rounded-xl md:py-2.5",
              active
                ? "bg-primary text-primary-fg"
                : "border-border bg-surface text-muted hover:text-fg hover:border-primary/60 border md:border-transparent md:bg-transparent",
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
