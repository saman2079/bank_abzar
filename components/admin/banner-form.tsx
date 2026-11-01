"use client";

import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormMessage } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { saveBannerAction } from "@/modules/banners/admin/actions";
import { ACCEPT_ATTRIBUTE } from "@/modules/media/constants";

export type BannerFormValues = {
  id: string;
  title: string;
  subtitle: string | null;
  ctaLabel: string | null;
  linkUrl: string | null;
  imageUrl: string | null;
  mobileImageUrl: string | null;
  imageAlt: string | null;
  isActive: boolean;
  /** `YYYY-MM-DDTHH:mm` به وقت تهران */
  startsAt: string;
  endsAt: string;
};

/** آپلود به `POST /api/admin/banners/images` (تصویر تازه‌کدشده‌ی WebP) */
function ImagePicker({
  label,
  hint,
  name,
  initial,
}: {
  label: string;
  hint: string;
  name: string;
  initial: string | null;
}) {
  const [url, setUrl] = useState(initial ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/admin/banners/images", { method: "POST", body });
      const json = (await response.json().catch(() => null)) as { ok?: boolean; url?: string; error?: string } | null;
      if (response.ok && json?.ok && json.url) setUrl(json.url);
      else setError(json?.error ?? "آپلود ناموفق بود.");
    } catch {
      setError("ارتباط با سرور برقرار نشد.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-bold">{label}</p>
      <input type="hidden" name={name} value={url} />
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- پیش‌نمایش پنل؛ تصویر تازه آپلودشده است
        <img src={url} alt="پیش‌نمایش بنر" className="border-border max-h-40 rounded-xl border object-cover" />
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? "در حال آپلود…" : url ? "تغییر تصویر" : "انتخاب تصویر"}
        </Button>
        {url ? (
          <Button type="button" variant="outline" size="sm" className="text-danger" onClick={() => setUrl("")}>
            حذف تصویر
          </Button>
        ) : null}
        <input ref={input} type="file" accept={ACCEPT_ATTRIBUTE} hidden onChange={(event) => onFile(event.target.files?.[0])} />
      </div>
      <p className="text-muted text-xs">{hint}</p>
      <FormMessage error={error ?? undefined} />
    </div>
  );
}

export function BannerForm({ banner }: { banner?: BannerFormValues }) {
  const [state, action] = useActionState(saveBannerAction, {});

  return (
    <form action={action} className="grid max-w-2xl gap-5">
      {banner ? <input type="hidden" name="id" value={banner.id} /> : null}

      <Field label="عنوان" htmlFor="bn-title" hint="متن بزرگ روی بنر (حداکثر ۸۰ نویسه).">
        <Input id="bn-title" name="title" defaultValue={banner?.title} required maxLength={80} />
      </Field>
      <Field label="زیرعنوان (اختیاری)" htmlFor="bn-sub">
        <Input id="bn-sub" name="subtitle" defaultValue={banner?.subtitle ?? ""} maxLength={160} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="متن دکمه (اختیاری)" htmlFor="bn-cta" hint="مثل «مشاهده محصولات»؛ بدون آن، کل بنر لینک است.">
          <Input id="bn-cta" name="ctaLabel" defaultValue={banner?.ctaLabel ?? ""} maxLength={30} />
        </Field>
        <Field label="لینک (اختیاری)" htmlFor="bn-link" hint="مثل /categories/power-tools یا https://…">
          <Input id="bn-link" name="linkUrl" dir="ltr" defaultValue={banner?.linkUrl ?? ""} maxLength={300} />
        </Field>
      </div>

      <ImagePicker
        label="تصویر دسکتاپ"
        name="imageUrl"
        initial={banner?.imageUrl ?? null}
        hint="پیشنهاد: ۱۶۰۰×۵۳۳ (نسبت ۳:۱). بدون تصویر، بنر با پس‌زمینه‌ی گرادیانی نمایش داده می‌شود."
      />
      <ImagePicker
        label="تصویر موبایل (اختیاری)"
        name="mobileImageUrl"
        initial={banner?.mobileImageUrl ?? null}
        hint="پیشنهاد: ۱۰۰۰×۷۵۰ (نسبت ۴:۳). بدون آن، تصویر دسکتاپ استفاده می‌شود."
      />
      <Field label="متن جایگزین تصویر (alt)" htmlFor="bn-alt" hint="برای سئو و دسترسی‌پذیری؛ خالی = عنوان بنر.">
        <Input id="bn-alt" name="imageAlt" defaultValue={banner?.imageAlt ?? ""} maxLength={160} />
      </Field>

      <fieldset className="border-border grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
        <legend className="px-2 text-sm font-bold">زمان‌بندی (اختیاری، به وقت تهران)</legend>
        <Field label="شروع نمایش" htmlFor="bn-start">
          <Input id="bn-start" name="startsAt" type="datetime-local" dir="ltr" defaultValue={banner?.startsAt ?? ""} />
        </Field>
        <Field label="پایان نمایش" htmlFor="bn-end">
          <Input id="bn-end" name="endsAt" type="datetime-local" dir="ltr" defaultValue={banner?.endsAt ?? ""} />
        </Field>
        <p className="text-muted text-xs sm:col-span-2">خالی = همیشه (تا وقتی «فعال» باشد). تغییر زمان تا چند دقیقه بعد در سایت اعمال می‌شود.</p>
      </fieldset>

      <label className="flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" name="isActive" defaultChecked={banner ? banner.isActive : true} className="size-4" />
        فعال (نمایش در اسلایدر صفحه‌ی اول)
      </label>

      <div className="space-y-3">
        <FormMessage error={state.error} success={state.ok ? "ذخیره شد." : undefined} />
        <SubmitButton pendingLabel="در حال ذخیره…">{banner ? "ذخیره تغییرات" : "ساخت بنر"}</SubmitButton>
      </div>
    </form>
  );
}
