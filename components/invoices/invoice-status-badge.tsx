import { Badge } from "@/components/ui/badge";
import { INVOICE_STATUS_LABELS, type InvoiceStatus } from "@/modules/invoices/constants";

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const tone = status === "CANCELED" ? "danger" : status === "FINAL" ? "primary" : "neutral";
  return <Badge tone={tone}>{INVOICE_STATUS_LABELS[status]}</Badge>;
}
