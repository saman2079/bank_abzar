"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { startPaymentAction } from "@/modules/payments/actions";

export function PayButton({ orderId }: { orderId: string }) {
  const [state, action] = useActionState(startPaymentAction, {});

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="orderId" value={orderId} />
      <SubmitButton pendingLabel="انتقال به درگاه…">پرداخت آنلاین</SubmitButton>
      <FormMessage error={state.error} />
    </form>
  );
}
