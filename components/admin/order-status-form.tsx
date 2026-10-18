"use client";

import { useActionState } from "react";
import { Field, FormMessage } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { changeOrderStatusAction } from "@/modules/orders/admin/actions";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/modules/orders/constants";

type OrderStatusFormProps = { orderId: string; allowed: readonly OrderStatus[] };

export function OrderStatusForm({ orderId, allowed }: OrderStatusFormProps) {
  const [state, action] = useActionState(changeOrderStatusAction, {});

  if (allowed.length === 0) {
    return <p className="text-muted text-sm">این سفارش در وضعیت نهایی است و تغییر وضعیت ندارد.</p>;
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="orderId" value={orderId} />

      <Field label="وضعیت جدید" htmlFor="os-to">
        <Select id="os-to" name="to" defaultValue={allowed[0]}>
          {allowed.map((status) => (
            <option key={status} value={status}>
              {ORDER_STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="توضیح / دلیل" htmlFor="os-note" hint="برای «پرداخت‌شده (دستی)»، «لغو» و «مرجوع» اجباری است و برای مشتری در timeline دیده می‌شود.">
        <Textarea id="os-note" name="note" rows={2} maxLength={300} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="restock" defaultChecked className="accent-primary size-4" />
        در صورت «مرجوع»، کالاها به موجودی برگردند
      </label>

      <FormMessage error={state.error} success={state.ok ? "وضعیت تغییر کرد." : undefined} />
      <SubmitButton pendingLabel="در حال ثبت…">ثبت تغییر وضعیت</SubmitButton>
    </form>
  );
}
