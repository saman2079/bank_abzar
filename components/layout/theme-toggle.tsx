"use client";

import { Moon, Sun } from "lucide-react";

/**
 * تغییر تم روشن/تیره. تم فعلی از `data-theme` روی <html> خوانده می‌شود (نه state)،
 * پس سرور و کلاینت یکسان رندر می‌شوند و آیکون درست فقط با CSS (`dark:`) نشان داده می‌شود.
 */
export function ThemeToggle({ className }: { className?: string }) {
  function toggle() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // حالت خصوصی/بلاک‌شده: تم فقط برای همین نشست عوض می‌شود.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="تغییر تم روشن/تیره"
      title="تغییر تم روشن/تیره"
      className={
        className ??
        "text-fg hover:text-primary hover:bg-surface-2 relative grid size-10 place-items-center rounded-full transition-colors"
      }
    >
      <Moon className="size-5 dark:hidden" aria-hidden />
      <Sun className="hidden size-5 dark:block" aria-hidden />
    </button>
  );
}
