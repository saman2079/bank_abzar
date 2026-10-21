"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FormMessage } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { formatNumber, formatToman } from "@/lib/format";
import { createManualOrderAction } from "@/modules/orders/admin/actions";
import { PROVINCES } from "@/modules/users/constants";

type Product = { id: string; name: string; sku: string; price: number; stock: number };
type Row = { key: number; productId: string; quantity: string };

export function ManualOrderForm({ products }: { products: Product[] }) {
  const [state, action] = useActionState(createManualOrderAction, {});
  const [rows, setRows] = useState<Row[]>([{ key: 0, productId: "", quantity: "1" }]);
  const [nextKey, setNextKey] = useState(1);
  const [payment, setPayment] = useState("paid");

  const byId = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const estimate = rows.reduce((sum, row) => {
    const price = byId.get(row.productId)?.price ?? 0;
    const quantity = Number(row.quantity);
    return sum + (Number.isFinite(quantity) ? price * quantity : 0);
  }, 0);

  function updateRow(key: number, patch: Partial<Row>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  return (
    <form action={action} className="grid max-w-3xl gap-6">
      <section className="grid gap-4 md:grid-cols-2">
        <h2 className="font-bold md:col-span-2">مشتری</h2>
        <Field label="موبایل مشتری" htmlFor="mo-phone" hint="اگر حسابی با این شماره نباشد، ساخته می‌شود.">
          <Input id="mo-phone" name="phone" dir="ltr" inputMode="tel" required maxLength={20} />
        </Field>
        <Field label="نام مشتری (برای مشتری جدید)" htmlFor="mo-name">
          <Input id="mo-name" name="customerName" maxLength={80} />
        </Field>
      </section>

      <section className="space-y-3">
        <h2 className="font-bold">کالاها</h2>
        {rows.map((row) => (
          <div key={row.key} className="flex flex-wrap items-end gap-2">
            <div className="min-w-56 flex-1">
              <label className="sr-only" htmlFor={`mo-p-${row.key}`}>
                کالا
              </label>
              <Select id={`mo-p-${row.key}`} name="productId" value={row.productId} onChange={(event) => updateRow(row.key, { productId: event.target.value })}>
                <option value="">انتخاب کالا…</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} — {product.sku} — {formatToman(product.price)} (موجودی {formatNumber(product.stock)})
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-24">
              <label className="sr-only" htmlFor={`mo-q-${row.key}`}>
                تعداد
              </label>
              <Input id={`mo-q-${row.key}`} name="quantity" inputMode="numeric" dir="ltr" value={row.quantity} onChange={(event) => updateRow(row.key, { quantity: event.target.value })} />
            </div>
            <Button type="button" variant="outline" size="sm" aria-label="حذف ردیف" disabled={rows.length === 1} onClick={() => setRows((current) => current.filter((item) => item.key !== row.key))}>
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </div>
        ))}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setRows((current) => [...current, { key: nextKey, productId: "", quantity: "1" }]);
              setNextKey((value) => value + 1);
            }}
          >
            <Plus className="size-4" aria-hidden />
            افزودن کالا
          </Button>
          <p className="text-muted text-xs">جمع کالاها (پیش‌نمایش): {formatToman(estimate)} — مبلغ نهایی سمت سرور محاسبه می‌شود.</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <h2 className="font-bold md:col-span-2">آدرس ارسال</h2>
        <Field label="نام گیرنده" htmlFor="mo-rname">
          <Input id="mo-rname" name="receiverName" required maxLength={80} />
        </Field>
        <Field label="موبایل گیرنده" htmlFor="mo-rphone">
          <Input id="mo-rphone" name="receiverPhone" dir="ltr" inputMode="tel" required maxLength={20} />
        </Field>
        <Field label="استان" htmlFor="mo-province">
          <Select id="mo-province" name="province" defaultValue="" required>
            <option value="" disabled>
              انتخاب کنید
            </option>
            {PROVINCES.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="شهر" htmlFor="mo-city">
          <Input id="mo-city" name="city" required maxLength={60} />
        </Field>
        <Field label="کدپستی" htmlFor="mo-postal">
          <Input id="mo-postal" name="postalCode" dir="ltr" inputMode="numeric" required maxLength={12} />
        </Field>
        <Field label="پلاک" htmlFor="mo-plaque">
          <Input id="mo-plaque" name="plaque" required maxLength={10} />
        </Field>
        <Field label="واحد (اختیاری)" htmlFor="mo-unit">
          <Input id="mo-unit" name="unit" maxLength={10} />
        </Field>
        <Field label="نشانی کامل" htmlFor="mo-street" className="md:col-span-2">
          <Textarea id="mo-street" name="street" rows={2} required maxLength={250} />
        </Field>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <h2 className="font-bold md:col-span-2">پرداخت و ارسال</h2>
        <Field label="وضعیت پرداخت" htmlFor="mo-payment">
          <Select id="mo-payment" name="payment" value={payment} onChange={(event) => setPayment(event.target.value)}>
            <option value="paid">پرداخت شده (حضوری / کارت‌به‌کارت / تلفنی)</option>
            <option value="pending">در انتظار پرداخت (مشتری آنلاین می‌پردازد؛ مهلت ۳۰ دقیقه)</option>
          </Select>
        </Field>
        <Field label="هزینه‌ی ارسال (تومان، اختیاری)" htmlFor="mo-ship" hint="خالی = طبق تنظیمات؛ ۰ = رایگان/تحویل حضوری">
          <Input id="mo-ship" name="shippingCost" dir="ltr" inputMode="numeric" />
        </Field>
        {payment === "paid" ? (
          <Field label="روش / توضیح پرداخت" htmlFor="mo-paynote" hint="اجباری؛ مثلاً «کارت‌به‌کارت — ۴ رقم آخر کارت ۱۲۳۴» یا «نقدی در مغازه»" className="md:col-span-2">
            <Input id="mo-paynote" name="paymentNote" maxLength={300} required />
          </Field>
        ) : null}
        <Field label="توضیحات سفارش (اختیاری)" htmlFor="mo-note" className="md:col-span-2">
          <Textarea id="mo-note" name="note" rows={2} maxLength={300} />
        </Field>
      </section>

      <div className="space-y-3">
        <FormMessage error={state.error} />
        <SubmitButton pendingLabel="در حال ثبت…">ثبت سفارش</SubmitButton>
      </div>
    </form>
  );
}
