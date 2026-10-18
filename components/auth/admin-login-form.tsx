"use client";

import { useActionState } from "react";
import { Field, FormMessage } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { adminLoginAction } from "@/modules/auth/actions";

export function AdminLoginForm() {
  const [state, action] = useActionState(adminLoginAction, {});

  return (
    <form action={action} className="space-y-4">
      <Field label="شماره موبایل" htmlFor="phone">
        <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="username" dir="ltr" required autoFocus />
      </Field>
      <Field label="رمز عبور" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" dir="ltr" required />
      </Field>
      <FormMessage error={state.error} />
      <SubmitButton className="w-full" pendingLabel="در حال ورود…">
        ورود به پنل
      </SubmitButton>
    </form>
  );
}
