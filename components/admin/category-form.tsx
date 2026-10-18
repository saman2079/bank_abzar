"use client";

import { useActionState } from "react";
import { Field, FormMessage } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { saveCategoryAction } from "@/modules/catalog/admin/actions";

type Option = { id: string; name: string };
type CategoryFormValues = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
};

export function CategoryForm({ category, parents }: { category?: CategoryFormValues; parents: Option[] }) {
  const [state, action] = useActionState(saveCategoryAction, {});

  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      {category ? <input type="hidden" name="id" value={category.id} /> : null}

      <Field label="نام دسته" htmlFor="cf-name">
        <Input id="cf-name" name="name" defaultValue={category?.name} required maxLength={80} />
      </Field>
      <Field label="نامک (slug)" htmlFor="cf-slug">
        <Input id="cf-slug" name="slug" dir="ltr" defaultValue={category?.slug} required maxLength={80} />
      </Field>
      <Field label="دسته‌ی والد (اختیاری)" htmlFor="cf-parent">
        <Select id="cf-parent" name="parentId" defaultValue={category?.parentId ?? ""}>
          <option value="">— بدون والد —</option>
          {parents
            .filter((parent) => parent.id !== category?.id)
            .map((parent) => (
              <option key={parent.id} value={parent.id}>
                {parent.name}
              </option>
            ))}
        </Select>
      </Field>
      <Field label="ترتیب نمایش" htmlFor="cf-order" hint="عدد کمتر = بالاتر">
        <Input id="cf-order" name="sortOrder" inputMode="numeric" dir="ltr" defaultValue={category?.sortOrder ?? 0} />
      </Field>
      <Field label="توضیحات (اختیاری)" htmlFor="cf-desc" className="md:col-span-2">
        <Textarea id="cf-desc" name="description" rows={3} defaultValue={category?.description ?? ""} maxLength={500} />
      </Field>
      <Field label="عنوان سئو (اختیاری)" htmlFor="cf-seot">
        <Input id="cf-seot" name="seoTitle" defaultValue={category?.seoTitle ?? ""} maxLength={70} />
      </Field>
      <Field label="توضیح متای سئو (اختیاری)" htmlFor="cf-seod">
        <Input id="cf-seod" name="seoDescription" defaultValue={category?.seoDescription ?? ""} maxLength={160} />
      </Field>
      <label className="flex items-center gap-2 text-sm md:col-span-2">
        <input type="checkbox" name="isActive" defaultChecked={category?.isActive ?? true} className="accent-primary size-4" />
        فعال (نمایش در سایت)
      </label>

      <div className="space-y-3 md:col-span-2">
        <FormMessage error={state.error} success={state.ok ? "ذخیره شد." : undefined} />
        <SubmitButton pendingLabel="در حال ذخیره…">{category ? "ذخیره تغییرات" : "ساخت دسته"}</SubmitButton>
      </div>
    </form>
  );
}
