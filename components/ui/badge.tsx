import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "danger" | "primary" | "neutral";

const tones: Record<Tone, string> = {
  danger: "bg-danger text-white",
  primary: "bg-primary text-primary-fg",
  neutral: "bg-surface-2 text-muted border border-border",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & { tone?: Tone };

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold", tones[tone], className)}
      {...props}
    />
  );
}
