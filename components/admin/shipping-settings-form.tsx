"use client";

import { useActionState } from "react";
import { Field, FormMessage } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { saveShippingAction } from "@/modules/settings/actions";
import type { ShippingSettings } from "@/modules/settings/constants";

export function ShippingSettingsForm({ settings }: { settings: ShippingSettings }) {
  const [state, action] = useActionState(saveShippingAction, {});

  return (
    <form action={action} className="grid max-w-xl gap-4">
      <Field label="هزینه‌ی ارسال (تومان)" htmlFor="ss-flat" hint="برای سفارش‌هایی که از حد ارسال رایگان کمتر هستند.">
        <Input id="ss-flat" name="flatCost" inputMode="numeric" dir="ltr" defaultValue={settings.flatCost} required />
      </Field>
      <Field label="ارسال رایگان از مبلغ (تومان)" htmlFor="ss-free" hint="۰ = ارسال همیشه رایگان.">
        <Input id="ss-free" name="freeOver" inputMode="numeric" dir="ltr" defaultValue={settings.freeOver} required />
      </Field>

      <FormMessage error={state.error} success={state.ok ? "ذخیره شد." : undefined} />
      <SubmitButton pendingLabel="در حال ذخیره…">ذخیره تنظیمات</SubmitButton>
    </form>
  );
}
