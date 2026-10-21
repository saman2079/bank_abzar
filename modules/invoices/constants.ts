export const INVOICE_STATUSES = ["PROFORMA", "FINAL", "CANCELED"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  PROFORMA: "پیش‌فاکتور",
  FINAL: "فاکتور قطعی",
  CANCELED: "باطل‌شده",
};

/** عنوان چاپی سند بر اساس وضعیت. */
export const INVOICE_DOC_TITLES: Record<InvoiceStatus, string> = {
  PROFORMA: "پیش‌فاکتور",
  FINAL: "فاکتور فروش",
  CANCELED: "فاکتور باطل‌شده",
};

/** شماره‌ی نمایشی فاکتور (از ۱۰۰۱ شروع می‌شود؛ پیش‌فاکتور و فاکتور یک شماره دارند). */
export function formatInvoiceNumber(number: number): string {
  return String(1000 + number);
}

/**
 * مشخصات فروشنده روی چاپ فاکتور.
 * TODO(صاحب فروشگاه): تلفن، نشانی، شناسه‌ی اقتصادی/کدپستی را اینجا پر کنید
 * (بعداً به تنظیمات پنل منتقل می‌شود).
 */
export const INVOICE_SELLER = {
  name: "بانک ابزار",
  phone: "",
  address: "",
  economicCode: "",
} as const;

export const INVOICE_MAX_LINES = 60;

export type InvoiceLineInput = { unitPrice: number; quantity: number; discount: number };

/** مبلغ یک ردیف بعد از تخفیف ردیف (هرگز منفی نمی‌شود). */
export function lineTotal(line: InvoiceLineInput): number {
  return Math.max(0, line.unitPrice * line.quantity - line.discount);
}

export type InvoiceTotals = {
  subtotal: number;
  discount: number;
  taxAmount: number;
  total: number;
};

/**
 * محاسبه‌ی مبالغ فاکتور (تومان، عدد صحیح). تنها منبع محاسبه است؛ هم سرور هم پیش‌نمایش فرم از آن استفاده می‌کنند.
 * subtotal = جمع ردیف‌ها بعد از تخفیف ردیف؛ مالیات روی (subtotal − تخفیف کل) گرد می‌شود؛ ارسال مشمول مالیات نیست.
 */
export function calcInvoiceTotals(
  lines: readonly InvoiceLineInput[],
  options: { discount: number; taxPercent: number; shippingCost: number },
): InvoiceTotals {
  const subtotal = lines.reduce((sum, line) => sum + lineTotal(line), 0);
  const discount = Math.min(Math.max(0, options.discount), subtotal);
  const taxable = subtotal - discount;
  const taxAmount = Math.round((taxable * options.taxPercent) / 100);
  return { subtotal, discount, taxAmount, total: taxable + taxAmount + options.shippingCost };
}
