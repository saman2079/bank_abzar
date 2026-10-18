import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          "border-border bg-surface focus:border-primary h-11 w-full appearance-none rounded-xl border ps-4 pe-10 text-sm transition-colors outline-none disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="text-muted pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2"
        aria-hidden
      />
    </div>
  );
}