import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CancelInvoiceForm, FinalizeInvoiceForm } from "@/components/admin/invoice-actions";
import { InvoiceDocument } from "@/components/invoices/invoice-document";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { PrintButton } from "@/components/invoices/print-button";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireStaff } from "@/lib/dal";
import { formatDateTime, formatNumber } from "@/lib/format";
import { INVOICE_DOC_TITLES, formatInvoiceNumber } from "@/modules/invoices/constants";
import { getInvoice } from "@/modules/invoices/queries";

export const metadata: Metadata = { title: "فاکتور" };

export default async function AdminInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;

  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  const number = formatNumber(Number(formatInvoiceNumber(invoice.number)));

  return (
    <div className="space-y-6">
      {/* نوار ابزار: هنگام چاپ پنهان است */}
      <div className="space-y-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-extrabold">
              {INVOICE_DOC_TITLES[invoice.status]} {number}
            </h1>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PrintButton />
            {invoice.status === "PROFORMA" ? (
              <Link href={`/admin/invoices/${invoice.id}/edit`} className={buttonVariants({ variant: "outline" })}>
                ویرایش پیش‌فاکتور
              </Link>
            ) : null}
            <Link href="/admin/invoices" className={buttonVariants({ variant: "ghost" })}>
              فهرست فاکتورها
            </Link>
          </div>
        </div>

        <p className="text-muted text-xs">
          صادرکننده: {invoice.createdByLabel ?? "—"} — {formatDateTime(invoice.createdAt)}
          {invoice.finalizedAt ? ` — قطعی‌شده توسط ${invoice.finalizedByLabel ?? "—"} در ${formatDateTime(invoice.finalizedAt)}` : ""}
          {invoice.canceledAt ? ` — باطل‌شده توسط ${invoice.canceledByLabel ?? "—"} در ${formatDateTime(invoice.canceledAt)}` : ""}
        </p>

        {invoice.status !== "CANCELED" ? (
          <div className="grid gap-4 md:grid-cols-2">
            {invoice.status === "PROFORMA" ? (
              <Card className="space-y-3 p-5">
                <h2 className="font-bold">قطعی‌کردن فاکتور</h2>
                <p className="text-muted text-xs">وقتی مشتری پیش‌فاکتور را تأیید کرد؛ شماره‌ی فاکتور همان می‌ماند و موجودی کالاها کسر می‌شود.</p>
                <FinalizeInvoiceForm invoiceId={invoice.id} />
              </Card>
            ) : null}
            <Card className="space-y-3 p-5">
              <h2 className="font-bold">ابطال</h2>
              <CancelInvoiceForm invoiceId={invoice.id} status={invoice.status} />
            </Card>
          </div>
        ) : null}
      </div>

      <InvoiceDocument invoice={invoice} />
    </div>
  );
}
