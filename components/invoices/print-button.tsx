"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** پنجره‌ی چاپ مرورگر را باز می‌کند؛ از همان‌جا پرینتر متصل را انتخاب کنید یا «ذخیره به‌صورت PDF». */
export function PrintButton() {
  return (
    <Button type="button" onClick={() => window.print()}>
      <Printer className="size-4" aria-hidden />
      چاپ فاکتور
    </Button>
  );
}
