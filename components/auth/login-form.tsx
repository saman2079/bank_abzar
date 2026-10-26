"use client";

import { useActionState, useState } from "react";
import { Field, FormMessage } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { loginAction, registerAction } from "@/modules/auth/actions";
import { PASSWORD_MIN_LENGTH } from "@/modules/auth/constants";
import { cn } from "@/lib/utils";

type Mode = "login" | "register";

function PhoneField({ id }: { id: string }) {
  return (
    <Field label="شماره موبایل" htmlFor={id}>
      <Input
        id={id}
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        dir="ltr"
        placeholder="09123456789"
        required
      />
    </Field>
  );
}

function LoginPanel({ next }: { next?: string }) {
  const [state, action] = useActionState(loginAction, {});

  return (
    <form action={action} className="space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <PhoneField id="login-phone" />
      <Field label="رمز عبور" htmlFor="login-password">
        <Input id="login-password" name="password" type="password" autoComplete="current-password" dir="ltr" required />
      </Field>
      <FormMessage error={state.error} />
      <SubmitButton className="w-full" pendingLabel="در حال ورود…">
        ورود
      </SubmitButton>
    </form>
  );
}

function RegisterPanel({ next }: { next?: string }) {
  const [state, action] = useActionState(registerAction, {});

  return (
    <form action={action} className="space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <PhoneField id="register-phone" />
      <Field label="رمز عبور" htmlFor="register-password" hint={`حداقل ${PASSWORD_MIN_LENGTH} کاراکتر`}>
        <Input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          dir="ltr"
          required
        />
      </Field>
      <Field label="تکرار رمز عبور" htmlFor="register-confirm">
        <Input id="register-confirm" name="confirm" type="password" autoComplete="new-password" dir="ltr" required />
      </Field>
      <FormMessage error={state.error} />
      <SubmitButton className="w-full" pendingLabel="در حال ثبت‌نام…">
        ثبت‌نام
      </SubmitButton>
    </form>
  );
}

const tabClass = "flex-1 rounded-full px-4 py-2 text-sm font-bold transition-colors";

export function LoginForm({ next }: { next?: string }) {
  const [mode, setMode] = useState<Mode>("login");

  return (
    <div className="space-y-5">
      <div role="tablist" aria-label="ورود یا ثبت‌نام" className="bg-surface-2 flex gap-1 rounded-full p-1">
        {(
          [
            ["login", "ورود"],
            ["register", "ثبت‌نام"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => setMode(value)}
            className={cn(tabClass, mode === value ? "bg-primary text-primary-fg" : "text-muted hover:text-fg")}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "login" ? <LoginPanel next={next} /> : <RegisterPanel next={next} />}
    </div>
  );
}
