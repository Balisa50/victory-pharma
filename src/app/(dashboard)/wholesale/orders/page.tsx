"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableRowSkeleton } from "@/components/shared/LoadingSkeleton";
import type { OrderWithRelations } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((d) => d.data);

const STATUS_FILTERS = ["", "pending", "confirmed", "packed", "out_for_delivery", "delivered", "cancelled"];
const STATUS_LABELS: Record<string, string> = {
  "": "All",
  pending: "Pending",
  confirmed: "Confirmed",
  packed: "Packed",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function WholesaleOrdersPage() {
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = useSWR<{ orders: OrderWithRelations[]; total: number }>(
    `/api/orders${statusFilter ? `?status=${statusFilter}` : ""}`,
    fetcher,
    { refreshInterval: 15000 }
  );

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Orders</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === s
                ? "bg-emerald-600 text-white"
                : "border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase text-gray-400">
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Pharmacy</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={8} />)
              ) : (data?.orders?.length ?? 0) === 0 ? (
                <tr><td colSpan={8}><EmptyState message="No orders found" /></td></tr>
              ) : (
                data!.orders.map((o) => (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">#{o.id.slice(-8)}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {o.retailPharmacy.pharmacyName ?? o.retailPharmacy.name}
                        </p>
                        <p className="text-xs text-gray-400">{o.retailPharmacy.phone}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{o.orderItems.length}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(Number(o.totalAmount))}</td>
                    <td className="px-4 py-3">
                      {o.payment ? (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          o.payment.status === "confirmed"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {o.payment.status === "confirmed" ? "Confirmed" : "Pending"}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(o.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/wholesale/orders/${o.id}`}
                        className="text-xs font-medium text-emerald-600 hover:underline"
                      >
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
