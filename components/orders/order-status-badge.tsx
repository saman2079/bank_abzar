import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/modules/orders/constants";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const tone = status === "CANCELED" || status === "RETURNED" ? "danger" : status === "DELIVERED" || status === "PENDING_CONFIRMATION" ? "primary" : "neutral";

  return <Badge tone={tone}>{ORDER_STATUS_LABELS[status]}</Badge>;
}
