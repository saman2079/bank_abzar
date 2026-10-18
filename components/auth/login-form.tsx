"use client";

import { useActionState, useState } from "react";
import { Field, FormMessage } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { requestOtpAction, verifyOtpAction } from "@/modules/auth/actions";

function LoginFlow({ next, onReset }: { next?: string; onReset: () => void }) {
  const [requestState, requestAction] = useActionState(requestOtpAction, { step: "phone" });
  const [verifyState, verifyAction] = useActionState(verifyOtpAction, {});

  if (requestState.step === "phone") {
    return (
      <form action={requestAction} className="space-y-4">
        <Field label="شماره موبایل" htmlFor="phone" hint="کد تأیید به این شماره پیامک می‌شود.">
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            placeholder="09123456789"
            required
            autoFocus
          />
        </Field>
        <FormMessage error={requestState.error} />
        <SubmitButton className="w-full" pendingLabel="در حال ارسال…">
          دریافت کد
        </SubmitButton>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted text-sm">
        کد ۶ رقمی به <bdi dir="ltr">{requestState.phone}</bdi> ارسال شد.
      </p>

      <form action={verifyAction} className="space-y-4">
        <input type="hidden" name="phone" value={requestState.phone ?? ""} />
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <Field label="کد تأیید" htmlFor="code">
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            dir="ltr"
            maxLength={6}
            placeholder="------"
            className="text-center tracking-[0.5em]"
            required
            autoFocus
          />
        </Field>
        <FormMessage error={verifyState.error ?? requestState.error} />
        <SubmitButton className="w-full" pendingLabel="در حال بررسی…">
          ورود
        </SubmitButton>
      </form>

      <div className="flex items-center justify-between text-sm">
        <form action={requestAction}>
          <input type="hidden" name="phone" value={requestState.phone ?? ""} />
          <button type="submit" className="text-primary hover:underline">
            ارسال مجدد کد
          </button>
        </form>
        <button type="button" onClick={onReset} className="text-muted hover:text-fg">
          ویرایش شماره
        </button>
      </div>
    </div>
  );
}

export function LoginForm({ next }: { next?: string }) {
  // با تغییر key کل state فرم‌ها پاک می‌شود (بازگشت به مرحله‌ی شماره).
  const [session, setSession] = useState(0);

  return <LoginFlow key={session} next={next} onReset={() => setSession((value) => value + 1)} />;
}
