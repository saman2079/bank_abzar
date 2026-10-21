"use client";

import { useActionState } from "react";
import { Field, FormMessage } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { cancelInvoiceAction, finalizeInvoiceAction } from "@/modules/invoices/actions";
import type { InvoiceStatus } from "@/modules/invoices/constants";

/** تبدیل پیش‌فاکتور به قطعی (کسر موجودی). */
export function FinalizeInvoiceForm({ invoiceId }: { invoiceId: string }) {
  const [state, action] = useActionState(finalizeInvoiceAction, {});

  return (
    <form
      action={action}
      className="space-y-3"
      onSubmit={(event) => {
        if (!window.confirm("مشتری تأیید کرده؟ با قطعی‌شدن، موجودی انبار همین الان کسر می‌شود.")) event.preventDefault();
      }}
    >
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <Field label="روش / توضیح پرداخت (اختیاری)" htmlFor="fin-pay" hint="مثلاً «کارت‌به‌کارت» یا «نقدی»">
        <Input id="fin-pay" name="paymentNote" maxLength={300} />
      </Field>
      <FormMessage error={state.error} success={state.ok ? "فاکتور قطعی شد و موجودی کسر شد." : undefined} />
      <SubmitButton pendingLabel="در حال صدور…">تأیید مشتری — قطعی‌کردن فاکتور</SubmitButton>
    </form>
  );
}

/** ابطال با دلیل اجباری؛ برای فاکتور قطعی موجودی برمی‌گردد. */
export function CancelInvoiceForm({ invoiceId, status }: { invoiceId: string; status: Exclude<InvoiceStatus, "CANCELED"> }) {
  const [state, action] = useActionState(cancelInvoiceAction, {});

  return (
    <form
      action={action}
      className="space-y-3"
      onSubmit={(event) => {
        const message = status === "FINAL" ? "فاکتور باطل و موجودی کالاها به انبار برگردانده می‌شود. ادامه می‌دهید؟" : "پیش‌فاکتور باطل می‌شود. ادامه می‌دهید؟";
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <Field label="دلیل ابطال" htmlFor="can-reason" hint={status === "FINAL" ? "موجودی کالاها به انبار برمی‌گردد." : "پیش‌فاکتور روی انبار اثری ندارد."}>
        <Input id="can-reason" name="reason" required minLength={3} maxLength={300} />
      </Field>
      <FormMessage error={state.error} success={state.ok ? "فاکتور باطل شد." : undefined} />
      <SubmitButton variant="outline" pendingLabel="در حال ابطال…">
        ابطال {status === "FINAL" ? "فاکتور و برگشت موجودی" : "پیش‌فاکتور"}
      </SubmitButton>
    </form>
  );
}
