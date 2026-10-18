"use client";

import { useFormStatus } from "react-dom";
import { Button } from "./button";
import type { ComponentProps } from "react";

type SubmitButtonProps = Omit<ComponentProps<typeof Button>, "type" | "disabled"> & { pendingLabel?: string };

/** دکمه‌ی ارسال فرم؛ هنگام اجرای action غیرفعال می‌شود. */
export function SubmitButton({ children, pendingLabel = "لطفاً صبر کنید…", ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
