import { formatDateTime } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/modules/orders/constants";
import type { OrderDetail } from "@/modules/orders/types";

export function OrderTimeline({ history }: { history: OrderDetail["history"] }) {
  return (
    <ol className="border-border space-y-5 border-s ps-5">
      {history.map((entry, index) => (
        <li key={entry.id} className="relative">
          <span
            className={`absolute -start-[27px] top-1.5 size-3 rounded-full ${index === history.length - 1 ? "bg-primary" : "bg-border"}`}
            aria-hidden
          />
          <p className="text-sm font-bold">{ORDER_STATUS_LABELS[entry.to]}</p>
          <p className="text-muted text-xs">{formatDateTime(entry.createdAt)}</p>
          {entry.note ? <p className="text-muted mt-1 text-xs">{entry.note}</p> : null}
        </li>
      ))}
    </ol>
  );
}
