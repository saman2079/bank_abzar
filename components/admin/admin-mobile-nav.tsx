"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import type { Role } from "@/modules/auth/constants";
import { cn } from "@/lib/utils";
import { AdminNav } from "./admin-nav";

/** موبایل: دکمه‌ی منو + سایدبار کشویی (از سمت شروع/راست). با تغییر صفحه، Escape یا کلیک روی پس‌زمینه بسته می‌شود. */
export function AdminMobileNav({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // با رفتن به صفحه‌ی دیگر کشو بسته شود (الگوی «تنظیم state هنگام تغییر prop»).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="باز کردن منو"
        aria-expanded={open}
        aria-controls="admin-drawer"
        onClick={() => setOpen(true)}
        className="border-border hover:border-primary flex size-10 items-center justify-center rounded-xl border"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      <div className={cn("fixed inset-0 z-50", open ? "" : "pointer-events-none")} aria-hidden={!open}>
        <button
          type="button"
          tabIndex={-1}
          aria-label="بستن منو"
          onClick={() => setOpen(false)}
          className={cn("absolute inset-0 bg-black/60 transition-opacity", open ? "opacity-100" : "opacity-0")}
        />
        <aside
          id="admin-drawer"
          className={cn(
            "bg-surface border-border absolute inset-y-0 start-0 flex w-72 max-w-[85vw] flex-col gap-4 border-e p-4 transition-transform duration-200",
            open ? "translate-x-0" : "ltr:-translate-x-full rtl:translate-x-full",
          )}
        >
          <div className="flex items-center justify-between">
            <p className="font-extrabold">منوی مدیریت</p>
            <button
              type="button"
              aria-label="بستن منو"
              onClick={() => setOpen(false)}
              className="border-border hover:border-primary flex size-9 items-center justify-center rounded-xl border"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <div className="overflow-y-auto">
            <AdminNav role={role} />
          </div>
        </aside>
      </div>
    </div>
  );
}
