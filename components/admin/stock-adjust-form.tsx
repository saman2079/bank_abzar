"use client";

import { useActionState } from "react";
import { Field, FormMessage } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { adjustStockAction } from "@/modules/inventory/actions";
import { ADJUST_MODES, ADJUST_MODE_LABELS } from "@/modules/inventory/constants";

export function StockAdjustForm({ productId }: { productId: string }) {
  const [state, action] = useActionState(adjustStockAction, {});

  return (
    <form action={action} className="grid gap-4 md:grid-cols-3">
      <input type="hidden" name="productId" value={productId} />

      <Field label="نوع تغییر" htmlFor="sa-mode">
        <Select id="sa-mode" name="mode" defaultValue="IN">
          {ADJUST_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {ADJUST_MODE_LABELS[mode]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="تعداد" htmlFor="sa-qty">
        <Input id="sa-qty" name="quantity" inputMode="numeric" dir="ltr" required />
      </Field>
      <Field label="دلیل (اجباری)" htmlFor="sa-note">
        <Input id="sa-note" name="note" required minLength={3} maxLength={200} placeholder="مثلاً: فروش حضوری / ورود محموله" />
      </Field>

      <div className="space-y-3 md:col-span-3">
        <FormMessage error={state.error} success={state.ok ? "موجودی ثبت شد." : undefined} />
        <SubmitButton pendingLabel="در حال ثبت…">ثبت تغییر</SubmitButton>
      </div>
    </form>
  );
}
