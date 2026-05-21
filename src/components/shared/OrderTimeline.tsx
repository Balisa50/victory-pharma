import { Check } from "lucide-react";
import { formatDateTime, ORDER_STATUS_LABELS } from "@/lib/utils";
import type { OrderStatusHistory, OrderStatus } from "@/types";

const STATUS_ORDER: OrderStatus[] = [
  "pending",
  "confirmed",
  "packed",
  "out_for_delivery",
  "delivered",
];

export function OrderTimeline({ history }: { history: OrderStatusHistory[] }) {
  const historyMap = new Map(history.map((h) => [h.status, h]));
  const isCancelled = history.some((h) => h.status === "cancelled");

  if (isCancelled) {
    return (
      <div className="rounded-lg border border-[hsl(var(--red))]/20 bg-[hsl(var(--red))]/5 p-4 text-[13px] leading-relaxed text-[hsl(var(--red-2))]">
        This order was cancelled on{" "}
        {formatDateTime(history.find((h) => h.status === "cancelled")!.changedAt)}.
      </div>
    );
  }

  return (
    <ol className="relative ml-1 border-l border-neutral-200">
      {STATUS_ORDER.map((status) => {
        const entry = historyMap.get(status);
        const done = Boolean(entry);
        return (
          <li key={status} className="mb-6 ml-6 last:mb-0">
            <span
              className={`absolute -left-[13px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white ${
                done
                  ? "bg-[hsl(var(--navy))] text-[hsl(var(--gold))]"
                  : "bg-neutral-100 text-neutral-300"
              }`}
            >
              {done ? (
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
              )}
            </span>
            <p
              className={`text-[13.5px] font-medium ${
                done ? "text-[hsl(var(--navy))]" : "text-neutral-400"
              }`}
            >
              {ORDER_STATUS_LABELS[status]}
            </p>
            {entry && (
              <p className="mt-0.5 text-[11.5px] text-neutral-400">
                {formatDateTime(entry.changedAt)}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
