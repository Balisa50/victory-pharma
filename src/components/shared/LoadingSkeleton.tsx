import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-gray-200", className)} />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <Skeleton className="mb-3 h-4 w-24" />
      <Skeleton className="h-8 w-32" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}
