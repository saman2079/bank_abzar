"use client";

import { useActionState } from "react";
import { Field, FormMessage } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { createProductAction, updateProductAction } from "@/modules/catalog/admin/actions";
import { PRODUCT_STATUSES, PRODUCT_STATUS_LABELS } from "@/modules/catalog/admin/constants";
import type { AdminProduct } from "@/modules/catalog/admin/queries";

type Option = { id: string; name: string };
type ProductFormProps = { product?: AdminProduct; brands: Option[]; categories: Option[] };

export function ProductForm({ product, brands, categories }: ProductFormProps) {
  const [state, action] = useActionState(product ? updateProductAction : createProductAction, {});

  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}

      <Field label="نام محصول" htmlFor="pf-name" className="md:col-span-2">
        <Input id="pf-name" name="name" defaultValue={product?.name} required maxLength={160} />
      </Field>
      <Field label="کد کالا (SKU)" htmlFor="pf-sku">
        <Input id="pf-sku" name="sku" dir="ltr" defaultValue={product?.sku} required maxLength={40} />
      </Field>
      <Field label="نامک (slug)" htmlFor="pf-slug" hint="لاتین، مثل bosch-gsb-120-li؛ در آدرس صفحه می‌آید.">
        <Input id="pf-slug" name="slug" dir="ltr" defaultValue={product?.slug} required maxLength={80} />
      </Field>
      <Field label="برند" htmlFor="pf-brand">
        <Select id="pf-brand" name="brandId" defaultValue={product?.brandId ?? ""} required>
          <option value="" disabled>
            انتخاب کنید
          </option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="دسته‌بندی" htmlFor="pf-category">
        <Select id="pf-category" name="categoryId" defaultValue={product?.categoryId ?? ""} required>
          <option value="" disabled>
            انتخاب کنید
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="قیمت (تومان)" htmlFor="pf-price">
        <Input id="pf-price" name="price" inputMode="numeric" dir="ltr" defaultValue={product?.price} required />
      </Field>
      <Field label="قیمت قبل از تخفیف (اختیاری)" htmlFor="pf-compare" hint="اگر پر شود، درصد تخفیف خودکار محاسبه می‌شود.">
        <Input id="pf-compare" name="compareAtPrice" inputMode="numeric" dir="ltr" defaultValue={product?.compareAtPrice ?? ""} />
      </Field>
      <Field label="وضعیت" htmlFor="pf-status">
        <Select id="pf-status" name="status" defaultValue={product?.status ?? "DRAFT"}>
          {PRODUCT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {PRODUCT_STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="آستانه‌ی هشدار کمبود موجودی" htmlFor="pf-low">
        <Input id="pf-low" name="lowStockThreshold" inputMode="numeric" dir="ltr" defaultValue={product?.lowStockThreshold ?? 3} required />
      </Field>
      {product ? (
        <p className="text-muted self-end pb-3 text-xs md:col-span-2">
          موجودی فعلی: {product.stock} — تغییر موجودی فقط از صفحه‌ی «انبار» (با ثبت دلیل) ممکن است.
        </p>
      ) : (
        <Field label="موجودی اولیه" htmlFor="pf-stock" className="md:col-span-2">
          <Input id="pf-stock" name="initialStock" inputMode="numeric" dir="ltr" defaultValue={0} required />
        </Field>
      )}

      <Field label="توضیح کوتاه" htmlFor="pf-short" className="md:col-span-2">
        <Textarea id="pf-short" name="shortDescription" rows={2} defaultValue={product?.shortDescription} required maxLength={300} />
      </Field>
      <Field label="توضیحات کامل" htmlFor="pf-desc" className="md:col-span-2">
        <Textarea id="pf-desc" name="description" rows={8} defaultValue={product?.description} required maxLength={20000} />
      </Field>
      <Field label="مشخصات فنی" htmlFor="pf-specs" hint="هر خط یک مورد: «برچسب: مقدار»؛ مثل «توان موتور: ۸۰۰ وات»" className="md:col-span-2">
        <Textarea
          id="pf-specs"
          name="specs"
          rows={6}
          defaultValue={product?.specs.map((spec) => `${spec.label}: ${spec.value}`).join("\n")}
        />
      </Field>
      <Field label="عنوان سئو (اختیاری)" htmlFor="pf-seot" hint="حداکثر ۷۰ کاراکتر؛ خالی = ساخت خودکار">
        <Input id="pf-seot" name="seoTitle" defaultValue={product?.seoTitle ?? ""} maxLength={70} />
      </Field>
      <Field label="توضیح متای سئو (اختیاری)" htmlFor="pf-seod" hint="حداکثر ۱۶۰ کاراکتر">
        <Input id="pf-seod" name="seoDescription" defaultValue={product?.seoDescription ?? ""} maxLength={160} />
      </Field>

      <div className="space-y-3 md:col-span-2">
        <FormMessage error={state.error} success={state.ok ? "ذخیره شد." : undefined} />
        <SubmitButton pendingLabel="در حال ذخیره…">{product ? "ذخیره تغییرات" : "ساخت محصول"}</SubmitButton>
      </div>
    </form>
  );
}
