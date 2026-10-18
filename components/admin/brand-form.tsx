"use client";

import { useActionState } from "react";
import { Field, FormMessage } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { saveBrandAction } from "@/modules/catalog/admin/actions";

export function BrandForm({ brand }: { brand?: { id: string; name: string; slug: string } }) {
  const [state, action] = useActionState(saveBrandAction, {});

  return (
    <form action={action} className="grid max-w-xl gap-4">
      {brand ? <input type="hidden" name="id" value={brand.id} /> : null}

      <Field label="نام برند" htmlFor="bf-name" hint="مثل Bosch (همان نام در سایت نمایش داده می‌شود)">
        <Input id="bf-name" name="name" defaultValue={brand?.name} required maxLength={60} />
      </Field>
      <Field label="نامک (slug)" htmlFor="bf-slug">
        <Input id="bf-slug" name="slug" dir="ltr" defaultValue={brand?.slug} required maxLength={80} />
      </Field>

      <div className="space-y-3">
        <FormMessage error={state.error} success={state.ok ? "ذخیره شد." : undefined} />
        <SubmitButton pendingLabel="در حال ذخیره…">{brand ? "ذخیره تغییرات" : "ساخت برند"}</SubmitButton>
      </div>
    </form>
  );
}
