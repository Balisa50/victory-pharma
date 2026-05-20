import { cn, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        ORDER_STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700"
      )}
    >
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  );
}
