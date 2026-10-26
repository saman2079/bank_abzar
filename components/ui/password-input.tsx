"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

/** فیلد رمز عبور با دکمه‌ی چشم برای نمایش/پنهان‌کردن. */
export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input type={visible ? "text" : "password"} dir="ltr" className={cn("pr-11", className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "پنهان‌کردن رمز عبور" : "نمایش رمز عبور"}
        aria-pressed={visible}
        className="text-muted hover:text-fg absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-full transition-colors"
      >
        {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </button>
    </div>
  );
}
