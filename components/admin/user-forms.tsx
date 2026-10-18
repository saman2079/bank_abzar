"use client";

import { useActionState, useState } from "react";
import { Field, FormMessage } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { createUserAction, resetStaffPasswordAction, updateUserAction } from "@/modules/users/admin/actions";

export function CreateUserForm() {
  const [state, action] = useActionState(createUserAction, {});
  const [kind, setKind] = useState("CUSTOMER");

  return (
    <form action={action} className="grid max-w-xl gap-4">
      <Field label="نوع کاربر" htmlFor="cu-kind" hint="مشتری تلفنی بدون رمز است و بعداً با کد پیامکی وارد می‌شود.">
        <Select id="cu-kind" name="kind" value={kind} onChange={(event) => setKind(event.target.value)}>
          <option value="CUSTOMER">مشتری (ثبت تلفنی)</option>
          <option value="STAFF">کارمند پنل</option>
        </Select>
      </Field>
      <Field label="موبایل" htmlFor="cu-phone">
        <Input id="cu-phone" name="phone" dir="ltr" inputMode="tel" required maxLength={20} />
      </Field>
      <Field label="نام" htmlFor="cu-name">
        <Input id="cu-name" name="name" maxLength={80} />
      </Field>
      <Field label="ایمیل (اختیاری)" htmlFor="cu-email">
        <Input id="cu-email" name="email" type="email" dir="ltr" maxLength={120} />
      </Field>
      {kind === "STAFF" ? (
        <Field label="رمز ورود" htmlFor="cu-password" hint="حداقل ۱۲ کاراکتر">
          <Input id="cu-password" name="password" type="password" dir="ltr" autoComplete="new-password" minLength={12} required />
        </Field>
      ) : null}

      <FormMessage error={state.error} />
      <SubmitButton pendingLabel="در حال ساخت…">ساخت کاربر</SubmitButton>
    </form>
  );
}

type EditUserFormProps = { user: { id: string; name: string | null; email: string | null; isActive: boolean }; isSelf: boolean };

export function EditUserForm({ user, isSelf }: EditUserFormProps) {
  const [state, action] = useActionState(updateUserAction, {});

  return (
    <form action={action} className="grid max-w-xl gap-4">
      <input type="hidden" name="id" value={user.id} />
      <Field label="نام" htmlFor="eu-name">
        <Input id="eu-name" name="name" defaultValue={user.name ?? ""} maxLength={80} />
      </Field>
      <Field label="ایمیل" htmlFor="eu-email">
        <Input id="eu-email" name="email" type="email" dir="ltr" defaultValue={user.email ?? ""} maxLength={120} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={user.isActive} disabled={isSelf} className="accent-primary size-4" />
        حساب فعال است
        {isSelf ? <span className="text-muted">(حساب خودتان را نمی‌توانید غیرفعال کنید)</span> : null}
      </label>
      {/* checkbox غیرفعال ارسال نمی‌شود؛ برای حساب خود، فعال‌ماندن را صریح می‌فرستیم. */}
      {isSelf ? <input type="hidden" name="isActive" value="on" /> : null}

      <FormMessage error={state.error} success={state.ok ? "ذخیره شد." : undefined} />
      <SubmitButton pendingLabel="در حال ذخیره…">ذخیره تغییرات</SubmitButton>
    </form>
  );
}

export function ResetPasswordForm({ userId }: { userId: string }) {
  const [state, action] = useActionState(resetStaffPasswordAction, {});

  return (
    <form action={action} className="grid max-w-xl gap-4">
      <input type="hidden" name="id" value={userId} />
      <Field label="رمز جدید" htmlFor="rp-password" hint="حداقل ۱۲ کاراکتر؛ نشست‌های فعلی این کاربر بسته می‌شود.">
        <Input id="rp-password" name="password" type="password" dir="ltr" autoComplete="new-password" minLength={12} required />
      </Field>
      <FormMessage error={state.error} success={state.ok ? "رمز تغییر کرد." : undefined} />
      <SubmitButton pendingLabel="در حال ثبت…">تغییر رمز</SubmitButton>
    </form>
  );
}
