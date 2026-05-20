import { CheckCircle2, Circle } from "lucide-react";
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
      <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
        This order was cancelled on{" "}
        {formatDateTime(history.find((h) => h.status === "cancelled")!.changedAt)}
      </div>
    );
  }

  return (
    <ol className="relative border-l border-gray-200">
      {STATUS_ORDER.map((status) => {
        const entry = historyMap.get(status);
        return (
          <li key={status} className="mb-6 ml-6">
            <span
              className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white ${
                entry ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"
              }`}
            >
              {entry ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
            </span>
            <p className={`text-sm font-medium ${entry ? "text-gray-900" : "text-gray-400"}`}>
              {ORDER_STATUS_LABELS[status]}
            </p>
            {entry && (
              <p className="text-xs text-gray-500">{formatDateTime(entry.changedAt)}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
