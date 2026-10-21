import { formatDateTime, formatNumber } from "@/lib/format";
import { INVOICE_DOC_TITLES, INVOICE_SELLER, formatInvoiceNumber, lineTotal, type InvoiceStatus } from "@/modules/invoices/constants";

export type InvoiceDocumentData = {
  number: number;
  status: InvoiceStatus;
  customerName: string;
  customerPhone: string | null;
  customerAddress: string | null;
  subtotal: number;
  discount: number;
  taxPercent: number;
  taxAmount: number;
  shippingCost: number;
  total: number;
  note: string | null;
  paymentNote: string | null;
  validUntil: Date | null;
  createdAt: Date;
  finalizedAt: Date | null;
  canceledAt: Date | null;
  cancelReason: string | null;
  items: {
    id: string;
    nameSnapshot: string;
    skuSnapshot: string;
    unitPrice: number;
    quantity: number;
    discount: number;
  }[];
};

const faDate = new Intl.DateTimeFormat("fa-IR", { dateStyle: "long", timeZone: "Asia/Tehran" });

const th = "border border-neutral-400 bg-neutral-200 px-2 py-2 text-center text-xs font-bold [print-color-adjust:exact]";
const td = "border border-neutral-300 px-2 py-2 text-xs";

/**
 * سند چاپی فاکتور/پیش‌فاکتور. عمداً «کاغذ سفید» با رنگ‌های ثابت است (مستقل از دارک‌مود سایت)
 * تا روی پرینتر درست چاپ شود؛ چاپ با دکمه‌ی «چاپ» (پنجره‌ی چاپ مرورگر) انجام می‌شود.
 */
export function InvoiceDocument({ invoice }: { invoice: InvoiceDocumentData }) {
  const title = INVOICE_DOC_TITLES[invoice.status];
  const issuedAt = invoice.finalizedAt ?? invoice.createdAt;
  const expired = invoice.status === "PROFORMA" && invoice.validUntil !== null && invoice.validUntil.getTime() < Date.now();

  return (
    <article
      dir="rtl"
      aria-label={`${title} شماره ${formatNumber(Number(formatInvoiceNumber(invoice.number)))}`}
      className="relative mx-auto w-full max-w-[210mm] overflow-hidden rounded-xl bg-white p-6 text-neutral-900 shadow-lg print:max-w-none print:rounded-none print:p-0 print:shadow-none md:p-10"
    >
      {invoice.status === "CANCELED" ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="-rotate-25 rounded-2xl border-8 border-red-600/30 px-10 py-4 text-7xl font-extrabold text-red-600/30">باطل</span>
        </div>
      ) : null}

      <header className="flex items-start justify-between gap-4 border-b-4 border-neutral-900 pb-4">
        <div>
          <p className="text-2xl font-extrabold">{INVOICE_SELLER.name}</p>
          <p className="mt-1 text-xs text-neutral-600">فروشگاه تخصصی ابزارآلات دستی و برقی</p>
        </div>
        <div className="text-end">
          <h2 className="text-2xl font-extrabold">{title}</h2>
          <dl className="mt-2 space-y-0.5 text-xs">
            <div className="flex justify-end gap-2">
              <dt className="text-neutral-600">شماره:</dt>
              <dd className="font-bold">{formatNumber(Number(formatInvoiceNumber(invoice.number)))}</dd>
            </div>
            <div className="flex justify-end gap-2">
              <dt className="text-neutral-600">تاریخ:</dt>
              <dd className="font-bold">{faDate.format(issuedAt)}</dd>
            </div>
            {invoice.status === "PROFORMA" && invoice.validUntil ? (
              <div className="flex justify-end gap-2">
                <dt className="text-neutral-600">اعتبار تا:</dt>
                <dd className={expired ? "font-bold text-red-700" : "font-bold"}>
                  {faDate.format(invoice.validUntil)}
                  {expired ? " (منقضی)" : ""}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </header>

      <section className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
        <div className="rounded-lg border border-neutral-300 p-3">
          <h3 className="mb-1.5 text-sm font-bold">فروشنده</h3>
          <p>{INVOICE_SELLER.name}</p>
          {INVOICE_SELLER.phone ? <p>تلفن: {INVOICE_SELLER.phone}</p> : null}
          {INVOICE_SELLER.address ? <p>نشانی: {INVOICE_SELLER.address}</p> : null}
          {INVOICE_SELLER.economicCode ? <p>شناسه‌ی اقتصادی: {INVOICE_SELLER.economicCode}</p> : null}
        </div>
        <div className="rounded-lg border border-neutral-300 p-3">
          <h3 className="mb-1.5 text-sm font-bold">خریدار</h3>
          <p className="font-bold">{invoice.customerName}</p>
          {invoice.customerPhone ? (
            <p>
              تلفن: <span dir="ltr">{invoice.customerPhone}</span>
            </p>
          ) : null}
          {invoice.customerAddress ? <p>نشانی: {invoice.customerAddress}</p> : null}
        </div>
      </section>

      <table className="mt-4 w-full border-collapse">
        <thead>
          <tr>
            <th className={`${th} w-10`}>ردیف</th>
            <th className={`${th} w-24`}>کد کالا</th>
            <th className={th}>شرح کالا</th>
            <th className={`${th} w-14`}>تعداد</th>
            <th className={`${th} w-28`}>قیمت واحد (تومان)</th>
            <th className={`${th} w-24`}>تخفیف (تومان)</th>
            <th className={`${th} w-28`}>مبلغ کل (تومان)</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, index) => (
            <tr key={item.id} className="break-inside-avoid even:bg-neutral-50">
              <td className={`${td} text-center`}>{formatNumber(index + 1)}</td>
              <td className={`${td} text-center`} dir="ltr">
                {item.skuSnapshot}
              </td>
              <td className={`${td} font-medium`}>{item.nameSnapshot}</td>
              <td className={`${td} text-center`}>{formatNumber(item.quantity)}</td>
              <td className={`${td} text-center`}>{formatNumber(item.unitPrice)}</td>
              <td className={`${td} text-center`}>{item.discount > 0 ? formatNumber(item.discount) : "—"}</td>
              <td className={`${td} text-center font-bold`}>{formatNumber(lineTotal(item))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="mt-3 flex break-inside-avoid flex-wrap items-start justify-between gap-4">
        <div className="min-w-48 flex-1 space-y-2 text-xs">
          {invoice.note ? (
            <p>
              <span className="font-bold">توضیحات: </span>
              {invoice.note}
            </p>
          ) : null}
          {invoice.status === "FINAL" && invoice.paymentNote ? (
            <p>
              <span className="font-bold">روش پرداخت: </span>
              {invoice.paymentNote}
            </p>
          ) : null}
          {invoice.status === "PROFORMA" ? (
            <p className="text-neutral-600">این سند پیش‌فاکتور است و ارزش قطعی ندارد؛ قیمت‌ها و موجودی تا زمان صدور فاکتور تضمین نمی‌شود.</p>
          ) : null}
          {invoice.status === "CANCELED" ? (
            <p className="font-bold text-red-700">
              این سند باطل شده است{invoice.canceledAt ? ` (${faDate.format(invoice.canceledAt)})` : ""}
              {invoice.cancelReason ? ` — ${invoice.cancelReason}` : ""}
            </p>
          ) : null}
        </div>

        <dl className="w-full max-w-72 text-xs">
          <TotalRow label="جمع ردیف‌ها" value={invoice.subtotal} />
          {invoice.discount > 0 ? <TotalRow label="تخفیف کل" value={invoice.discount} negative /> : null}
          {invoice.taxPercent > 0 ? <TotalRow label={`مالیات بر ارزش افزوده (${formatNumber(invoice.taxPercent)}٪)`} value={invoice.taxAmount} /> : null}
          {invoice.shippingCost > 0 ? <TotalRow label="هزینه‌ی ارسال" value={invoice.shippingCost} /> : null}
          <div className="mt-1 flex items-center justify-between rounded-lg bg-neutral-900 px-3 py-2 text-sm font-extrabold text-white [print-color-adjust:exact]">
            <dt>مبلغ قابل پرداخت</dt>
            <dd>{formatNumber(invoice.total)} تومان</dd>
          </div>
        </dl>
      </section>

      <footer className="mt-10 grid break-inside-avoid grid-cols-2 gap-6 text-center text-xs">
        <div className="h-24 rounded-lg border border-neutral-300 p-2">مهر و امضای فروشنده</div>
        <div className="h-24 rounded-lg border border-neutral-300 p-2">مهر و امضای خریدار</div>
      </footer>
      <p className="mt-4 text-center text-[10px] text-neutral-500">
        صادرشده در {formatDateTime(invoice.createdAt)} — بانک ابزار
      </p>
    </article>
  );
}

function TotalRow({ label, value, negative }: { label: string; value: number; negative?: boolean }) {
  return (
    <div className="flex justify-between border-b border-neutral-200 px-1 py-1.5">
      <dt className="text-neutral-600">{label}</dt>
      <dd className="font-bold">
        {negative ? "−" : ""}
        {formatNumber(value)} تومان
      </dd>
    </div>
  );
}
