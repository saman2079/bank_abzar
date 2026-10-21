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
import { toLatinDigits } from "@/lib/phone";
import { calcInvoiceTotals, lineTotal } from "@/modules/invoices/constants";
import { saveInvoiceAction } from "@/modules/invoices/actions";

type Product = { id: string; name: string; sku: string; price: number; stock: number };
type Row = { key: number; productId: string; quantity: string; unitPrice: string; discount: string };

export type InvoiceFormInitial = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  lines: { productId: string; quantity: number; unitPrice: number; discount: number }[];
  discount: number;
  taxPercent: number;
  shippingCost: number;
  validDays: string;
  note: string;
  paymentNote: string;
};

/** عدد از ورودی فرم (ارقام فارسی و جداکننده‌ی هزارگان مجاز)؛ نامعتبر → ۰ (فقط برای پیش‌نمایش). */
function num(value: string): number {
  const parsed = Number(toLatinDigits(value).replace(/[,٬\s]/g, ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function InvoiceForm({ products, initial }: { products: Product[]; initial?: InvoiceFormInitial }) {
  const [state, action] = useActionState(saveInvoiceAction, {});

  const [customerName, setCustomerName] = useState(initial?.customerName ?? "");
  const [customerPhone, setCustomerPhone] = useState(initial?.customerPhone ?? "");
  const [customerAddress, setCustomerAddress] = useState(initial?.customerAddress ?? "");
  const [rows, setRows] = useState<Row[]>(
    initial?.lines.length
      ? initial.lines.map((line, index) => ({
          key: index,
          productId: line.productId,
          quantity: String(line.quantity),
          unitPrice: String(line.unitPrice),
          discount: String(line.discount),
        }))
      : [{ key: 0, productId: "", quantity: "1", unitPrice: "", discount: "0" }],
  );
  const [nextKey, setNextKey] = useState(initial?.lines.length ?? 1);
  const [discount, setDiscount] = useState(String(initial?.discount ?? 0));
  const [taxPercent, setTaxPercent] = useState(String(initial?.taxPercent ?? 0));
  const [shippingCost, setShippingCost] = useState(String(initial?.shippingCost ?? 0));
  const [validDays, setValidDays] = useState(initial?.validDays ?? "7");
  const [note, setNote] = useState(initial?.note ?? "");
  const [paymentNote, setPaymentNote] = useState(initial?.paymentNote ?? "");

  const byId = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

  const totals = calcInvoiceTotals(
    rows.map((row) => ({ unitPrice: num(row.unitPrice), quantity: num(row.quantity), discount: num(row.discount) })),
    { discount: num(discount), taxPercent: Math.min(100, num(taxPercent)), shippingCost: num(shippingCost) },
  );

  // کمبود موجودی (با جمع ردیف‌های تکراریِ یک کالا) فقط هشدار است؛ پیش‌فاکتور مجاز، قطعی‌کردن سمت سرور رد می‌شود.
  const requested = new Map<string, number>();
  for (const row of rows) if (row.productId) requested.set(row.productId, (requested.get(row.productId) ?? 0) + num(row.quantity));

  function updateRow(key: number, patch: Partial<Row>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((current) => [...current, { key: nextKey, productId: "", quantity: "1", unitPrice: "", discount: "0" }]);
    setNextKey((value) => value + 1);
  }

  return (
    <form action={action} className="grid max-w-4xl gap-6">
      {initial ? <input type="hidden" name="invoiceId" value={initial.id} /> : null}

      <section className="grid gap-4 md:grid-cols-2">
        <h2 className="font-bold md:col-span-2">مشتری</h2>
        <Field label="نام مشتری / شرکت" htmlFor="inv-name">
          <Input id="inv-name" name="customerName" value={customerName} onChange={(event) => setCustomerName(event.target.value)} required maxLength={120} />
        </Field>
        <Field label="موبایل (اختیاری)" htmlFor="inv-phone">
          <Input id="inv-phone" name="customerPhone" dir="ltr" inputMode="tel" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} maxLength={20} />
        </Field>
        <Field label="نشانی (اختیاری)" htmlFor="inv-address" className="md:col-span-2">
          <Textarea id="inv-address" name="customerAddress" rows={2} value={customerAddress} onChange={(event) => setCustomerAddress(event.target.value)} maxLength={300} />
        </Field>
      </section>

      <section className="space-y-3">
        <h2 className="font-bold">اقلام</h2>
        <p className="text-muted text-xs">قیمت واحد با انتخاب کالا از قیمت فعلی پر می‌شود و برای این فاکتور قابل تغییر است (قیمت توافقی).</p>

        {rows.map((row) => {
          const product = byId.get(row.productId);
          const short = product !== undefined && (requested.get(product.id) ?? 0) > product.stock;
          return (
            <div key={row.key} className="border-border space-y-2 rounded-xl border p-3">
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-56 flex-1">
                  <label className="sr-only" htmlFor={`inv-p-${row.key}`}>
                    کالا
                  </label>
                  <Select
                    id={`inv-p-${row.key}`}
                    name="productId"
                    value={row.productId}
                    onChange={(event) => {
                      const picked = byId.get(event.target.value);
                      updateRow(row.key, { productId: event.target.value, unitPrice: picked ? String(picked.price) : "" });
                    }}
                  >
                    <option value="">انتخاب کالا…</option>
                    {products.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} — {item.sku} (موجودی {formatNumber(item.stock)})
                      </option>
                    ))}
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label="حذف ردیف"
                  disabled={rows.length === 1}
                  onClick={() => setRows((current) => current.filter((item) => item.key !== row.key))}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <Field label="تعداد" htmlFor={`inv-q-${row.key}`}>
                  <Input id={`inv-q-${row.key}`} name="quantity" inputMode="numeric" dir="ltr" value={row.quantity} onChange={(event) => updateRow(row.key, { quantity: event.target.value })} />
                </Field>
                <Field label="قیمت واحد (تومان)" htmlFor={`inv-u-${row.key}`}>
                  <Input id={`inv-u-${row.key}`} name="unitPrice" inputMode="numeric" dir="ltr" value={row.unitPrice} onChange={(event) => updateRow(row.key, { unitPrice: event.target.value })} />
                </Field>
                <Field label="تخفیف ردیف (تومان)" htmlFor={`inv-d-${row.key}`}>
                  <Input id={`inv-d-${row.key}`} name="lineDiscount" inputMode="numeric" dir="ltr" value={row.discount} onChange={(event) => updateRow(row.key, { discount: event.target.value })} />
                </Field>
                <div className="space-y-1.5">
                  <p className="text-sm font-bold">مبلغ ردیف</p>
                  <p className="flex h-11 items-center text-sm">
                    {formatToman(lineTotal({ unitPrice: num(row.unitPrice), quantity: num(row.quantity), discount: num(row.discount) }))}
                  </p>
                </div>
              </div>
              {short ? (
                <p role="status" className="text-danger text-xs">
                  موجودی فعلی ({formatNumber(product.stock)}) کمتر از تعداد درخواستی است؛ ذخیره به‌صورت پیش‌فاکتور ممکن است، ولی صدور فاکتور قطعی رد می‌شود.
                </p>
              ) : null}
            </div>
          );
        })}

        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="size-4" aria-hidden />
          افزودن کالا
        </Button>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <h2 className="font-bold md:col-span-2">مبالغ و شرایط</h2>
        <Field label="تخفیف کل (تومان)" htmlFor="inv-discount">
          <Input id="inv-discount" name="discount" inputMode="numeric" dir="ltr" value={discount} onChange={(event) => setDiscount(event.target.value)} />
        </Field>
        <Field label="مالیات بر ارزش افزوده (٪)" htmlFor="inv-tax" hint="۰ = بدون مالیات">
          <Input id="inv-tax" name="taxPercent" inputMode="numeric" dir="ltr" value={taxPercent} onChange={(event) => setTaxPercent(event.target.value)} />
        </Field>
        <Field label="هزینه‌ی ارسال (تومان)" htmlFor="inv-ship">
          <Input id="inv-ship" name="shippingCost" inputMode="numeric" dir="ltr" value={shippingCost} onChange={(event) => setShippingCost(event.target.value)} />
        </Field>
        <Field label="اعتبار پیش‌فاکتور (روز)" htmlFor="inv-valid" hint="خالی = بدون محدودیت">
          <Input id="inv-valid" name="validDays" inputMode="numeric" dir="ltr" value={validDays} onChange={(event) => setValidDays(event.target.value)} />
        </Field>
        <Field label="توضیحات (روی فاکتور چاپ می‌شود)" htmlFor="inv-note" className="md:col-span-2">
          <Textarea id="inv-note" name="note" rows={2} value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} />
        </Field>
        <Field label="روش / توضیح پرداخت (فقط فاکتور قطعی)" htmlFor="inv-paynote" hint="مثلاً «کارت‌به‌کارت»، «نقدی»، «چک ۳۰ روزه»" className="md:col-span-2">
          <Input id="inv-paynote" name="paymentNote" value={paymentNote} onChange={(event) => setPaymentNote(event.target.value)} maxLength={300} />
        </Field>
      </section>

      <section className="border-border bg-surface rounded-card space-y-1 border p-5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">جمع ردیف‌ها</span>
          <span>{formatToman(totals.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">تخفیف کل</span>
          <span>{formatToman(totals.discount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">مالیات</span>
          <span>{formatToman(totals.taxAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">ارسال</span>
          <span>{formatToman(num(shippingCost))}</span>
        </div>
        <div className="border-border flex justify-between border-t pt-2 text-base font-extrabold">
          <span>مبلغ قابل پرداخت</span>
          <span>{formatToman(totals.total)}</span>
        </div>
        <p className="text-muted pt-1 text-xs">پیش‌نمایش است؛ مبلغ نهایی سمت سرور دوباره محاسبه می‌شود.</p>
      </section>

      <div className="space-y-3">
        <FormMessage error={state.error} />
        <div className="flex flex-wrap gap-3">
          <SubmitButton name="mode" value="proforma" variant="outline" pendingLabel="در حال ثبت…">
            {initial ? "ذخیره‌ی تغییرات پیش‌فاکتور" : "ذخیره به‌عنوان پیش‌فاکتور"}
          </SubmitButton>
          <SubmitButton
            name="mode"
            value="final"
            pendingLabel="در حال صدور…"
            onClick={(event) => {
              if (!window.confirm("فاکتور قطعی صادر و موجودی انبار همین الان کسر می‌شود. ادامه می‌دهید؟")) event.preventDefault();
            }}
          >
            صدور فاکتور قطعی و کسر موجودی
          </SubmitButton>
        </div>
        <p className="text-muted text-xs">پیش‌فاکتور روی انبار اثری ندارد. با قطعی‌شدن، موجودی همان لحظه و اتمیک کسر می‌شود.</p>
      </div>
    </form>
  );
}
