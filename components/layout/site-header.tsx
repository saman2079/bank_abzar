import Link from "next/link";
import { Suspense } from "react";
import { Heart, Search, Wrench } from "lucide-react";
import { AccountLink, AccountLinkFallback } from "./account-link";
import { CartLink, CartLinkFallback } from "./cart-link";
import { NavLink } from "./nav-link";
import { ThemeToggle } from "./theme-toggle";

const navItems = [
  { href: "/", label: "صفحه اصلی" },
  { href: "/products", label: "فروشگاه" },
  { href: "/categories", label: "دسته‌بندی‌ها" },
  { href: "/blog", label: "مقالات" },
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس با ما" },
] as const;

const linkClass = "relative py-2 text-sm text-muted transition-colors hover:text-fg";
const activeClass = "text-primary after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-primary";

function SearchForm({ className }: { className?: string }) {
  return (
    <form action="/products" role="search" className={className}>
      <label htmlFor="header-search" className="sr-only">
        جستجو در محصولات
      </label>
      <div className="border-border bg-surface focus-within:border-primary flex h-11 items-center gap-2 rounded-full border px-4 transition-colors">
        <Search className="text-muted size-4 shrink-0" aria-hidden />
        <input
          id="header-search"
          name="q"
          type="search"
          placeholder="جستجو در بین هزاران ابزار و تجهیزات..."
          className="placeholder:text-muted w-full bg-transparent text-sm outline-none"
        />
      </div>
    </form>
  );
}

function IconLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="text-fg hover:text-primary hover:bg-surface-2 relative grid size-10 place-items-center rounded-full transition-colors"
    >
      {children}
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="border-border bg-surface glass-blur sticky top-0 z-40 border-b">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:gap-8">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold">
          <span className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-[#3bb8f5] to-[#1b7fc4] text-white shadow-md">
            <Wrench className="size-5" aria-hidden />
          </span>
          بانک ابزار
        </Link>

        <nav aria-label="منوی اصلی" className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Suspense
              key={item.href}
              fallback={
                <Link href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              }
            >
              <NavLink href={item.href} className={linkClass} activeClassName={activeClass}>
                {item.label}
              </NavLink>
            </Suspense>
          ))}
        </nav>

        <SearchForm className="mx-auto hidden w-full max-w-md md:block" />

        <div className="ms-auto flex items-center gap-1 md:ms-0">
          <Suspense fallback={<AccountLinkFallback />}>
            <AccountLink />
          </Suspense>
          <ThemeToggle />
          <IconLink href="/account/wishlist" label="علاقه‌مندی‌ها">
            <Heart className="size-5" aria-hidden />
          </IconLink>
          <Suspense fallback={<CartLinkFallback />}>
            <CartLink />
          </Suspense>
        </div>
      </div>

      <div className="px-4 pb-3 md:hidden">
        <SearchForm />
      </div>
    </header>
  );
}
