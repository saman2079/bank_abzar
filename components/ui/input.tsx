import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type = "text", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        "border-border bg-surface placeholder:text-muted focus:border-primary h-11 w-full rounded-xl border px-4 text-sm transition-colors outline-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
