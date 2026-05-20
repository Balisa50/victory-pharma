"use client";

import useSWR from "swr";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency, formatDate, ORDER_STATUS_LABELS } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CardSkeleton, TableRowSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import type { WholesaleDashboardData } from "@/types";
import { TrendingUp, AlertTriangle, ShoppingBag, Package } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((d) => d.data);

export default function WholesaleDashboard() {
  const { data, isLoading } = useSWR<WholesaleDashboardData>(
    "/api/dashboard/wholesale",
    fetcher,
    { refreshInterval: 30000 }
  );

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* KPI cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <KpiCard
              icon={TrendingUp}
              label="Total Revenue"
              value={formatCurrency(data?.totalRevenue ?? 0)}
              color="emerald"
            />
            <KpiCard
              icon={AlertTriangle}
              label="Pending Payments"
              value={formatCurrency(data?.pendingPayments ?? 0)}
              color="yellow"
            />
            <KpiCard
              icon={ShoppingBag}
              label="Total Orders"
              value={String(data?.totalOrders ?? 0)}
              color="blue"
            />
            <KpiCard
              icon={Package}
              label="Low Stock Items"
              value={String(data?.lowStockCount ?? 0)}
              color="red"
            />
          </>
        )}
      </div>

      {/* Revenue chart */}
      <div className="mb-8 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">Revenue — last 7 days</h2>
        {isLoading ? (
          <div className="h-48 animate-pulse rounded bg-gray-100" />
        ) : (data?.revenueChart?.length ?? 0) === 0 ? (
          <EmptyState message="No revenue data yet" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.revenueChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `D${v}`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent orders */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="font-semibold text-gray-900">Recent Orders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 text-left text-xs font-medium uppercase text-gray-400">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Pharmacy</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={4} />)
                ) : (data?.recentOrders?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <EmptyState message="No orders yet" />
                    </td>
                  </tr>
                ) : (
                  data?.recentOrders.map((o) => (
                    <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        #{o.id.slice(-8)}
                      </td>
                      <td className="px-4 py-3">
                        {o.retailPharmacy.pharmacyName ?? o.retailPharmacy.name}
                      </td>
                      <td className="px-4 py-3">{formatCurrency(Number(o.totalAmount))}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={o.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low stock */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="font-semibold text-gray-900">Low Stock Alert</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 text-left text-xs font-medium uppercase text-gray-400">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Stock</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={3} />)
                ) : (data?.lowStockProducts?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={3}>
                      <EmptyState message="No low stock items" />
                    </td>
                  </tr>
                ) : (
                  data?.lowStockProducts.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                      <td className="px-4 py-3 text-gray-500">{p.category}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-red-600">{p.stockQuantity}</span>
                      </td>
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

function KpiCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: "emerald" | "yellow" | "blue" | "red";
}) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-600",
    yellow: "bg-yellow-50 text-yellow-600",
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-600",
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
