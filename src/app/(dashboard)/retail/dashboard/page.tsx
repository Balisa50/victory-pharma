"use client";

import useSWR from "swr";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CardSkeleton, TableRowSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import type { RetailDashboardData } from "@/types";
import { ShoppingBag, Receipt, CheckCircle2, DollarSign } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((d) => d.data);

export default function RetailDashboard() {
  const { data, isLoading } = useSWR<RetailDashboardData>(
    "/api/dashboard/retail",
    fetcher,
    { refreshInterval: 30000 }
  );

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <StatCard icon={ShoppingBag} label="Active Orders" value={String(data?.activeOrders?.length ?? 0)} color="blue" />
            <StatCard icon={CheckCircle2} label="Completed Orders" value={String(data?.orderHistory?.length ?? 0)} color="emerald" />
            <StatCard icon={DollarSign} label="Total Spending" value={formatCurrency(data?.totalSpending ?? 0)} color="purple" />
            <StatCard icon={Receipt} label="Receipts" value={String(data?.recentReceipts?.length ?? 0)} color="orange" />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active orders */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h2 className="font-semibold text-gray-900">Active Orders</h2>
            <Link href="/retail/orders" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => <TableRowSkeleton key={i} cols={3} />)
                ) : (data?.activeOrders?.length ?? 0) === 0 ? (
                  <tr><td colSpan={3}><EmptyState message="No active orders" /></td></tr>
                ) : (
                  data!.activeOrders.map((o) => (
                    <tr key={o.id} className="border-b border-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">#{o.id.slice(-8)}</td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(Number(o.totalAmount))}</td>
                      <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent receipts */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h2 className="font-semibold text-gray-900">Recent Receipts</h2>
            <Link href="/retail/receipts" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => <TableRowSkeleton key={i} cols={3} />)
                ) : (data?.recentReceipts?.length ?? 0) === 0 ? (
                  <tr><td colSpan={3}><EmptyState message="No receipts yet" /></td></tr>
                ) : (
                  data!.recentReceipts.map((r) => (
                    <tr key={r.id} className="border-b border-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">#{r.id.slice(-8)}</td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(Number(r.totalAmount))}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDate(r.generatedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: "blue" | "emerald" | "purple" | "orange";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className={`mb-3 inline-flex rounded-lg p-2 ${colors[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
