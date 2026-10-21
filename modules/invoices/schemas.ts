import { z } from "zod";
import { toLatinDigits } from "@/lib/phone";
import { phoneSchema } from "@/modules/auth/schemas";
import { tomanField } from "@/modules/settings/schemas";
import { INVOICE_MAX_LINES } from "./constants";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `حداکثر ${max} کاراکتر`)
    .transform((value) => value || null);

const intField = (label: string, min: number, max: number) =>
  z
    .string()
    .transform((value) => toLatinDigits(value).trim())
    .pipe(z.string().regex(/^\d{1,6}$/, `${label} نامعتبر است`))
    .transform(Number)
    .pipe(z.number().int().min(min, `${label} نامعتبر است`).max(max, `${label} نامعتبر است`));

/** ردیف فاکتور: قیمت واحد توافقی است (می‌تواند با قیمت فعلی محصول فرق کند). */
const lineSchema = z.object({
  productId: z.string().min(1, "برای همه‌ی ردیف‌ها کالا انتخاب کنید").max(40),
  quantity: intField("تعداد", 1, 99_999),
  unitPrice: tomanField("قیمت واحد"),
  discount: tomanField("تخفیف ردیف"),
});

export const invoiceFormSchema = z.object({
  /** فقط هنگام ویرایش پیش‌فاکتور */
  invoiceId: z.string().max(40).optional(),
  /** `proforma` = فقط ذخیره؛ `final` = صدور فاکتور قطعی و کسر موجودی */
  mode: z.enum(["proforma", "final"]),
  customerName: z.string().trim().min(2, "نام مشتری را وارد کنید").max(120, "حداکثر ۱۲۰ کاراکتر"),
  customerPhone: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .pipe(z.union([z.null(), phoneSchema])),
  customerAddress: optionalText(300),
  lines: z.array(lineSchema).min(1, "حداقل یک کالا اضافه کنید").max(INVOICE_MAX_LINES, `حداکثر ${INVOICE_MAX_LINES} ردیف`),
  discount: tomanField("تخفیف کل"),
  taxPercent: intField("درصد مالیات", 0, 100),
  shippingCost: tomanField("هزینه‌ی ارسال"),
  /** اعتبار پیش‌فاکتور به روز؛ خالی = بدون محدودیت */
  validDays: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .pipe(z.union([z.null(), intField("مهلت اعتبار", 1, 365)])),
  note: optionalText(500),
  paymentNote: optionalText(300),
});

export type InvoiceFormInput = z.output<typeof invoiceFormSchema>;

export const finalizeInvoiceSchema = z.object({
  invoiceId: z.string().min(1).max(40),
  paymentNote: optionalText(300),
});

export const cancelInvoiceSchema = z.object({
  invoiceId: z.string().min(1).max(40),
  reason: z.string().trim().min(3, "دلیل ابطال (حداقل ۳ کاراکتر) لازم است").max(300, "حداکثر ۳۰۰ کاراکتر"),
});
