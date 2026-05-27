"use client";

import useSWR from "swr";
import dynamic from "next/dynamic";
import { formatCurrency, PAYMENT_METHOD_LABELS } from "@/lib/utils";
import { PageHeader, PageBody, Panel, StatTile } from "@/components/shared/Editorial";
import { EmptyState } from "@/components/shared/EmptyState";

type ReportData = {
  monthlyRevenue: { month: string; revenue: number }[];
  topProducts: { name: string; units: number; revenue: number }[];
  topPharmacies: { id: string; name: string; pharmacyName: string | null; total: number; orders: number }[];
  statusMix: { status: string; count: number }[];
  totalOrders: number;
  expensesByCategory: { category: string; total: number }[];
  paymentMethodBreakdown: { method: string; total: number; count: number }[];
  totalExpenses: number;
  grossProfit: number;
  totalCreditIssued: number;
  totalCreditOutstanding: number;
};

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((d) => d.data as ReportData);

const RevenueArea = dynamic(
  () => import("@/components/shared/RevenueChart").then((m) => m.RevenueArea),
  { ssr: false, loading: () => <div className="h-[240px] animate-pulse rounded bg-neutral-50" /> }
);

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Processed",
  packed: "Packed",
  out_for_delivery: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function ReportsPage() {
  const { data, isLoading } = useSWR<ReportData>("/api/admin/reports", fetcher, {
    refreshInterval: 60000,
  });

  const monthlyData =
    data?.monthlyRevenue.map((m) => ({ date: m.month, revenue: m.revenue })) ?? [];

  const totalRevenue = data?.monthlyRevenue.reduce((s, m) => s + m.revenue, 0) ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="Business"
        accent="reports"
        description="Trends, expenses, credit, and order mix across the last twelve months."
      />

      <PageBody>
        {/* Key metrics row */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            eyebrow="12-month revenue"
            value={isLoading ? "…" : formatCurrency(totalRevenue)}
            tone="navy"
          />
          <StatTile
            eyebrow="Total expenses"
            value={isLoading ? "…" : formatCurrency(data?.totalExpenses ?? 0)}
            tone="red"
          />
          <StatTile
            eyebrow="Gross profit"
            value={isLoading ? "…" : formatCurrency(data?.grossProfit ?? 0)}
            footnote="Revenue minus expenses."
            tone={(data?.grossProfit ?? 0) >= 0 ? "green" : "red"}
          />
          <StatTile
            eyebrow="Credit outstanding"
            value={isLoading ? "…" : formatCurrency(data?.totalCreditOutstanding ?? 0)}
            footnote="Unpaid balances across all pharmacies."
            tone="gold"
          />
        </div>

        {/* Monthly revenue chart */}
        <Panel eyebrow="Last 12 months" title="Monthly" accent="revenue">
          <div className="px-4 py-6">
            {isLoading ? (
              <div className="h-56 animate-pulse rounded bg-neutral-50" />
            ) : monthlyData.length === 0 ? (
              <div className="py-12">
                <EmptyState message="No confirmed payments yet to chart." />
              </div>
            ) : (
              <RevenueArea data={monthlyData} />
            )}
          </div>
        </Panel>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Top products */}
          <Panel eyebrow="Best sellers" title="Top" accent="products">
            <div className="overflow-x-auto">
              <table className="w-full text-[13.5px]">
                <thead>
                  <tr className="ed-thead">
                    <th className="px-6 py-3 md:px-7">Product</th>
                    <th className="px-4 py-3 text-right">Units</th>
                    <th className="px-6 py-3 text-right md:px-7">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="border-b border-neutral-100">
                        <td colSpan={3} className="h-12 animate-pulse bg-neutral-50/60" />
                      </tr>
                    ))
                  ) : (data?.topProducts.length ?? 0) === 0 ? (
                    <tr>
                      <td colSpan={3}><EmptyState message="No sales recorded yet." /></td>
                    </tr>
                  ) : (
                    data!.topProducts.map((p, i) => (
                      <tr key={`${p.name}-${i}`} className="ed-row">
                        <td className="px-6 py-3.5 md:px-7">
                          <span className="serif italic text-[hsl(var(--navy))]">{p.name}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right text-neutral-600">{p.units}</td>
                        <td className="px-6 py-3.5 text-right font-medium text-[hsl(var(--navy))] md:px-7">
                          {formatCurrency(p.revenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* Top pharmacies */}
          <Panel eyebrow="Top partners" title="Best" accent="pharmacies">
            <div className="overflow-x-auto">
              <table className="w-full text-[13.5px]">
                <thead>
                  <tr className="ed-thead">
                    <th className="px-6 py-3 md:px-7">Pharmacy</th>
                    <th className="px-4 py-3 text-right">Orders</th>
                    <th className="px-6 py-3 text-right md:px-7">Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="border-b border-neutral-100">
                        <td colSpan={3} className="h-12 animate-pulse bg-neutral-50/60" />
                      </tr>
                    ))
                  ) : (data?.topPharmacies.length ?? 0) === 0 ? (
                    <tr>
                      <td colSpan={3}><EmptyState message="No orders yet." /></td>
                    </tr>
                  ) : (
                    data!.topPharmacies.map((p) => (
                      <tr key={p.id} className="ed-row">
                        <td className="px-6 py-3.5 md:px-7">
                          <span className="serif italic text-[hsl(var(--navy))]">
                            {p.pharmacyName ?? p.name}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right text-neutral-600">{p.orders}</td>
                        <td className="px-6 py-3.5 text-right font-medium text-[hsl(var(--navy))] md:px-7">
                          {formatCurrency(p.total)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Expenses by category */}
          <Panel eyebrow="Operations" title="Expenses" accent="by category">
            <div className="overflow-x-auto">
              <table className="w-full text-[13.5px]">
                <thead>
                  <tr className="ed-thead">
                    <th className="px-6 py-3 md:px-7">Category</th>
                    <th className="px-6 py-3 text-right md:px-7">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="border-b border-neutral-100">
                        <td colSpan={2} className="h-12 animate-pulse bg-neutral-50/60" />
                      </tr>
                    ))
                  ) : (data?.expensesByCategory.length ?? 0) === 0 ? (
                    <tr>
                      <td colSpan={2}><EmptyState message="No expenses recorded yet." /></td>
                    </tr>
                  ) : (
                    data!.expensesByCategory.map((e) => (
                      <tr key={e.category} className="ed-row">
                        <td className="px-6 py-3.5 md:px-7">
                          <span className="rounded-full bg-[hsl(var(--navy))]/8 px-2.5 py-0.5 text-[11.5px] font-medium text-[hsl(var(--navy))]">
                            {e.category}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right font-medium text-[hsl(var(--red-2))] md:px-7">
                          {formatCurrency(e.total)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* Payment method breakdown */}
          <Panel eyebrow="Payments" title="Method" accent="breakdown">
            <div className="overflow-x-auto">
              <table className="w-full text-[13.5px]">
                <thead>
                  <tr className="ed-thead">
                    <th className="px-6 py-3 md:px-7">Method</th>
                    <th className="px-4 py-3 text-right">Count</th>
                    <th className="px-6 py-3 text-right md:px-7">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="border-b border-neutral-100">
                        <td colSpan={3} className="h-12 animate-pulse bg-neutral-50/60" />
                      </tr>
                    ))
                  ) : (data?.paymentMethodBreakdown.length ?? 0) === 0 ? (
                    <tr>
                      <td colSpan={3}><EmptyState message="No confirmed payments yet." /></td>
                    </tr>
                  ) : (
                    data!.paymentMethodBreakdown.map((m) => (
                      <tr key={m.method} className="ed-row">
                        <td className="px-6 py-3.5 md:px-7">
                          <span className="serif italic text-[hsl(var(--navy))]">
                            {PAYMENT_METHOD_LABELS[m.method] ?? m.method}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right text-neutral-600">{m.count}</td>
                        <td className="px-6 py-3.5 text-right font-medium text-[hsl(var(--navy))] md:px-7">
                          {formatCurrency(m.total)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        {/* Order status mix */}
        <Panel
          eyebrow="Operations"
          title="Order"
          accent="status mix"
          action={
            data && (
              <span className="text-[11px] uppercase tracking-[0.14em] text-neutral-400">
                {data.totalOrders} total
              </span>
            )
          }
        >
          <div className="px-6 py-6 md:px-7">
            {isLoading ? (
              <div className="h-24 animate-pulse rounded bg-neutral-50" />
            ) : data && data.statusMix.length > 0 ? (
              <div className="space-y-3">
                {data.statusMix.map((s) => {
                  const pct = data.totalOrders > 0
                    ? Math.round((s.count / data.totalOrders) * 100)
                    : 0;
                  return (
                    <div key={s.status}>
                      <div className="mb-1 flex items-baseline justify-between text-[12.5px]">
                        <span className="font-medium text-[hsl(var(--navy))]">
                          {STATUS_LABELS[s.status] ?? s.status}
                        </span>
                        <span className="text-neutral-500">{s.count} · {pct}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[hsl(var(--offwhite))]">
                        <div
                          className="h-full rounded-full bg-[hsl(var(--navy))]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState message="No orders to break down yet." />
            )}
          </div>
        </Panel>
      </PageBody>
    </>
  );
}
