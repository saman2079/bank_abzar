"use client";

import { useActionState, useState } from "react";
import { Banknote, CreditCard } from "lucide-react";
import { Field, FormMessage } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { placeOrderAction } from "@/modules/orders/actions";
import { COD_NOT_ELIGIBLE_MESSAGE, isCodEligible } from "@/modules/orders/cod";
import { COD_CONFIRM_EXPIRY_HOURS, type PaymentMethod } from "@/modules/orders/constants";
import type { AddressView } from "@/modules/users/types";

export function CheckoutForm({ addresses }: { addresses: AddressView[] }) {
  const [state, action] = useActionState(placeOrderAction, {});
  const defaultId = addresses.find((address) => address.isDefault)?.id ?? addresses[0]?.id;
  const [addressId, setAddressId] = useState(defaultId);
  const [method, setMethod] = useState<PaymentMethod>("ONLINE");

  const selected = addresses.find((address) => address.id === addressId);
  const codAllowed = selected ? isCodEligible(selected) : false;
  // اگر آدرس به غیر تهران عوض شد، «پرداخت در محل» خودکار کنار می‌رود (سرور هم دوباره بررسی می‌کند).
  const effectiveMethod: PaymentMethod = method === "COD" && !codAllowed ? "ONLINE" : method;

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
              checked={address.id === addressId}
              onChange={() => setAddressId(address.id)}
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

      <fieldset className="space-y-3">
        <legend className="mb-2 font-bold">روش پرداخت</legend>
        <label className="border-border has-[:checked]:border-primary flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm">
          <input
            type="radio"
            name="paymentMethod"
            value="ONLINE"
            checked={effectiveMethod === "ONLINE"}
            onChange={() => setMethod("ONLINE")}
            className="accent-primary mt-1"
          />
          <span className="space-y-1">
            <span className="flex items-center gap-2 font-bold">
              <CreditCard className="size-4" aria-hidden />
              پرداخت آنلاین
            </span>
            <span className="text-muted block text-xs">پرداخت امن از طریق درگاه زرین‌پال پس از ثبت سفارش.</span>
          </span>
        </label>

        <label
          className={`border-border has-[:checked]:border-primary flex items-start gap-3 rounded-xl border p-4 text-sm ${codAllowed ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
        >
          <input
            type="radio"
            name="paymentMethod"
            value="COD"
            checked={effectiveMethod === "COD"}
            onChange={() => setMethod("COD")}
            disabled={!codAllowed}
            className="accent-primary mt-1"
          />
          <span className="space-y-1">
            <span className="flex items-center gap-2 font-bold">
              <Banknote className="size-4" aria-hidden />
              پرداخت در محل
              <span className="bg-primary/15 text-primary rounded-full px-2 py-0.5 text-[11px]">فقط تهران</span>
            </span>
            <span className="text-muted block text-xs">
              {codAllowed
                ? "مبلغ را هنگام تحویل بپردازید. سفارش پس از تماس تلفنی همکاران ما تأیید می‌شود."
                : COD_NOT_ELIGIBLE_MESSAGE}
            </span>
          </span>
        </label>
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
        {effectiveMethod === "COD" ? "ثبت سفارش (پرداخت در محل)" : "ثبت سفارش"}
      </SubmitButton>
      <p className="text-muted text-xs">
        {effectiveMethod === "COD"
          ? `همکاران ما برای تأیید سفارش با شما تماس می‌گیرند. سفارش تأییدنشده تا ${COD_CONFIRM_EXPIRY_HOURS} ساعت نگه داشته می‌شود؛ سپس لغو و موجودی آزاد می‌شود.`
          : "سفارش تا ۳۰ دقیقه برای پرداخت نگه داشته می‌شود؛ سپس لغو و موجودی آزاد می‌شود."}
      </p>
    </form>
  );
}
