"use client";

import useSWR from "swr";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableRowSkeleton } from "@/components/shared/LoadingSkeleton";
import type { Receipt } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((d) =>
    d.data?.recentReceipts ?? []
  );

export default function RetailReceiptsPage() {
  const { data, isLoading } = useSWR<(Receipt & { order: { id: string; createdAt: Date; totalAmount: unknown } })[]>(
    "/api/dashboard/retail",
    fetcher
  );

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Receipts</h1>
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase text-gray-400">
                <th className="px-4 py-3">Receipt ID</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)
              ) : (data?.length ?? 0) === 0 ? (
                <tr><td colSpan={5}><EmptyState message="No receipts yet" /></td></tr>
              ) : (
                data!.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">#{r.id.slice(-8)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">#{r.orderId.slice(-8)}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(Number(r.totalAmount))}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(r.generatedAt)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/retail/receipts/${r.id}`} className="text-xs font-medium text-blue-600 hover:underline">
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
