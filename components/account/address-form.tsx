"use client";

import { useActionState } from "react";
import { Field, FormMessage } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { saveAddressAction } from "@/modules/users/actions";
import { PROVINCES } from "@/modules/users/constants";
import type { AddressView } from "@/modules/users/types";

/** با `address` ویرایش، بدون آن افزودن. `idPrefix` برای یکتایی idها وقتی چند فرم در صفحه است. */
export function AddressForm({ address, idPrefix }: { address?: AddressView; idPrefix: string }) {
  const [state, action] = useActionState(saveAddressAction, {});
  const id = (name: string) => `${idPrefix}-${name}`;

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {address ? <input type="hidden" name="id" value={address.id} /> : null}

      <Field label="نام گیرنده" htmlFor={id("receiverName")}>
        <Input id={id("receiverName")} name="receiverName" defaultValue={address?.receiverName} required />
      </Field>
      <Field label="موبایل گیرنده" htmlFor={id("receiverPhone")}>
        <Input
          id={id("receiverPhone")}
          name="receiverPhone"
          type="tel"
          inputMode="tel"
          dir="ltr"
          defaultValue={address?.receiverPhone}
          required
        />
      </Field>
      <Field label="استان" htmlFor={id("province")}>
        <Select id={id("province")} name="province" defaultValue={address?.province ?? ""} required>
          <option value="" disabled>
            انتخاب کنید
          </option>
          {PROVINCES.map((province) => (
            <option key={province} value={province}>
              {province}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="شهر" htmlFor={id("city")}>
        <Input id={id("city")} name="city" defaultValue={address?.city} required />
      </Field>
      <Field label="نشانی کامل" htmlFor={id("street")} className="sm:col-span-2">
        <Input id={id("street")} name="street" defaultValue={address?.street} required />
      </Field>
      <Field label="پلاک" htmlFor={id("plaque")}>
        <Input id={id("plaque")} name="plaque" defaultValue={address?.plaque} required />
      </Field>
      <Field label="واحد (اختیاری)" htmlFor={id("unit")}>
        <Input id={id("unit")} name="unit" defaultValue={address?.unit ?? ""} />
      </Field>
      <Field label="کدپستی" htmlFor={id("postalCode")}>
        <Input
          id={id("postalCode")}
          name="postalCode"
          inputMode="numeric"
          dir="ltr"
          maxLength={10}
          defaultValue={address?.postalCode}
          required
        />
      </Field>
      <label className="flex items-center gap-2 self-end pb-3 text-sm">
        <input type="checkbox" name="isDefault" defaultChecked={address?.isDefault} className="accent-primary size-4" />
        آدرس پیش‌فرض
      </label>

      <div className="space-y-3 sm:col-span-2">
        <FormMessage error={state.error} success={state.ok ? "ذخیره شد." : undefined} />
        <SubmitButton pendingLabel="در حال ذخیره…">{address ? "ذخیره تغییرات" : "افزودن آدرس"}</SubmitButton>
      </div>
    </form>
  );
}
