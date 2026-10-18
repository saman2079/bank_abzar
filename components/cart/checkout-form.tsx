"use client";

import { useActionState } from "react";
import { Field, FormMessage } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { placeOrderAction } from "@/modules/orders/actions";
import type { AddressView } from "@/modules/users/types";

export function CheckoutForm({ addresses }: { addresses: AddressView[] }) {
  const [state, action] = useActionState(placeOrderAction, {});
  const defaultId = addresses.find((address) => address.isDefault)?.id ?? addresses[0]?.id;

  return (
    <form action={action} className="space-y-5">
      <fieldset className="space-y-3">
        <legend className="mb-2 font-bold">آدرس تحویل</legend>
        {addresses.map((address) => (
          <label
            key={address.id}
            className="border-border has-[:checked]:border-primary flex cursor-pointer gap-3 rounded-xl border p-4 text-sm"
          >
            <input
              type="radio"
              name="addressId"
              value={address.id}
              defaultChecked={address.id === defaultId}
              className="accent-primary mt-1"
              required
            />
            <span className="leading-7">
              <b>{address.receiverName}</b> — <bdi dir="ltr">{address.receiverPhone}</bdi>
              <br />
              {address.province}، {address.city}، {address.street}، پلاک {address.plaque}
              {address.unit ? `، واحد ${address.unit}` : ""} — کدپستی <bdi dir="ltr">{address.postalCode}</bdi>
            </span>
          </label>
        ))}
      </fieldset>

      <Field label="توضیحات سفارش (اختیاری)" htmlFor="order-note">
        <textarea
          id="order-note"
          name="note"
          rows={3}
          maxLength={300}
          className="border-border bg-surface focus:border-primary w-full rounded-xl border p-3 text-sm outline-none"
        />
      </Field>

      <FormMessage error={state.error} />
      <SubmitButton size="lg" className="w-full" pendingLabel="در حال ثبت سفارش…">
        ثبت سفارش
      </SubmitButton>
      <p className="text-muted text-xs">سفارش تا ۳۰ دقیقه برای پرداخت نگه داشته می‌شود؛ سپس لغو و موجودی آزاد می‌شود.</p>
    </form>
  );
}
