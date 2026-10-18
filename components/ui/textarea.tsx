import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, rows = 4, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={rows}
      className={cn(
        "border-border bg-surface placeholder:text-muted focus:border-primary w-full rounded-xl border p-3 text-sm leading-7 transition-colors outline-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
