import Link from "next/link";
import { Suspense } from "react";
import { Heart, House, LayoutGrid, ShoppingCart, User } from "lucide-react";
import { NavLink } from "./nav-link";

const items = [
  { href: "/", label: "خانه", Icon: House },
  { href: "/categories", label: "دسته‌بندی‌ها", Icon: LayoutGrid },
  { href: "/account/wishlist", label: "علاقه‌مندی", Icon: Heart },
  { href: "/account", label: "حساب", Icon: User },
  { href: "/cart", label: "سبد خرید", Icon: ShoppingCart },
] as const;

const itemClass = "flex flex-col items-center gap-1 py-2 text-[11px] text-muted transition-colors";
const activeClass = "text-primary";

export function BottomNav() {
  return (
    <nav
      aria-label="ناوبری موبایل"
      className="border-border bg-surface/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {items.map(({ href, label, Icon }) => (
          <li key={href}>
            <Suspense
              fallback={
                <Link href={href} className={itemClass}>
                  <Icon className="size-5" aria-hidden />
                  {label}
                </Link>
              }
            >
              <NavLink href={href} className={itemClass} activeClassName={activeClass}>
                <Icon className="size-5" aria-hidden />
                {label}
              </NavLink>
            </Suspense>
          </li>
        ))}
      </ul>
    </nav>
  );
}