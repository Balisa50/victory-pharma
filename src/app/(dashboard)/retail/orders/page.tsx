"use client";

import useSWR from "swr";
import Link from "next/link";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableRowSkeleton } from "@/components/shared/LoadingSkeleton";
import type { OrderWithRelations } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((d) => d.data);

export default function RetailOrdersPage() {
  const { data, isLoading } = useSWR<{ orders: OrderWithRelations[] }>(
    "/api/orders",
    fetcher,
    { refreshInterval: 15000 }
  );

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">My Orders</h1>
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase text-gray-400">
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
              ) : (data?.orders?.length ?? 0) === 0 ? (
                <tr><td colSpan={6}><EmptyState message="No orders yet. Browse the catalog to place your first order." /></td></tr>
              ) : (
                data!.orders.map((o) => (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">#{o.id.slice(-8)}</td>
                    <td className="px-4 py-3 text-gray-500">{o.orderItems.length} item{o.orderItems.length !== 1 ? "s" : ""}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(Number(o.totalAmount))}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(o.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/retail/orders/${o.id}`} className="text-xs font-medium text-blue-600 hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
