"use client";

import { useActionState } from "react";
import { Field, FormMessage } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateProfileAction } from "@/modules/users/actions";

type ProfileFormProps = { phone: string; name: string | null; email: string | null };

export function ProfileForm({ phone, name, email }: ProfileFormProps) {
  const [state, action] = useActionState(updateProfileAction, {});

  return (
    <form action={action} className="max-w-md space-y-4">
      <Field label="شماره موبایل" htmlFor="profile-phone" hint="شماره‌ی ثبت‌نام قابل تغییر نیست.">
        <Input id="profile-phone" value={phone} dir="ltr" readOnly disabled />
      </Field>
      <Field label="نام و نام خانوادگی" htmlFor="profile-name">
        <Input id="profile-name" name="name" defaultValue={name ?? ""} autoComplete="name" maxLength={80} />
      </Field>
      <Field label="ایمیل (اختیاری)" htmlFor="profile-email">
        <Input
          id="profile-email"
          name="email"
          type="email"
          dir="ltr"
          defaultValue={email ?? ""}
          autoComplete="email"
          maxLength={120}
        />
      </Field>
      <FormMessage error={state.error} success={state.ok ? "ذخیره شد." : undefined} />
      <SubmitButton pendingLabel="در حال ذخیره…">ذخیره</SubmitButton>
    </form>
  );
}
