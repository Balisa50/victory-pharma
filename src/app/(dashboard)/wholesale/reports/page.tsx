"use client";

import useSWR from "swr";
import dynamic from "next/dynamic";
import { formatCurrency } from "@/lib/utils";
import { PageHeader, PageBody, Panel } from "@/components/shared/Editorial";
import { EmptyState } from "@/components/shared/EmptyState";

type ReportData = {
  monthlyRevenue: { month: string; revenue: number }[];
  topProducts: { name: string; units: number; revenue: number }[];
  topPharmacies: {
    id: string;
    name: string;
    pharmacyName: string | null;
    total: number;
    orders: number;
  }[];
  statusMix: { status: string; count: number }[];
  totalOrders: number;
};

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((d) => d.data as ReportData);

const RevenueArea = dynamic(
  () =>
    import("@/components/shared/RevenueChart").then((m) => m.RevenueArea),
  {
    ssr: false,
    loading: () => <div className="h-[240px] animate-pulse rounded bg-neutral-50" />,
  }
);

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  packed: "Packed",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function ReportsPage() {
  const { data, isLoading } = useSWR("/api/admin/reports", fetcher, {
    refreshInterval: 60000,
  });

  const monthlyData =
    data?.monthlyRevenue.map((m) => ({ date: m.month, revenue: m.revenue })) ??
    [];

  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="Business"
        accent="reports"
        description="Trends, top performers and order mix across the last twelve months."
      />

      <PageBody>
        {/* Monthly revenue */}
        <Panel
          eyebrow="Last 12 months"
          title="Monthly"
          accent="revenue"
        >
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
                      <td colSpan={3}>
                        <EmptyState message="No sales recorded yet." />
                      </td>
                    </tr>
                  ) : (
                    data!.topProducts.map((p, i) => (
                      <tr key={`${p.name}-${i}`} className="ed-row">
                        <td className="px-6 py-3.5 md:px-7">
                          <span className="serif italic text-[hsl(var(--navy))]">
                            {p.name}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right text-neutral-600">
                          {p.units}
                        </td>
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
                      <td colSpan={3}>
                        <EmptyState message="No orders yet." />
                      </td>
                    </tr>
                  ) : (
                    data!.topPharmacies.map((p) => (
                      <tr key={p.id} className="ed-row">
                        <td className="px-6 py-3.5 md:px-7">
                          <span className="serif italic text-[hsl(var(--navy))]">
                            {p.pharmacyName ?? p.name}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right text-neutral-600">
                          {p.orders}
                        </td>
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

        {/* Status mix */}
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
                  const pct =
                    data.totalOrders > 0
                      ? Math.round((s.count / data.totalOrders) * 100)
                      : 0;
                  return (
                    <div key={s.status}>
                      <div className="mb-1 flex items-baseline justify-between text-[12.5px]">
                        <span className="font-medium text-[hsl(var(--navy))]">
                          {STATUS_LABELS[s.status] ?? s.status}
                        </span>
                        <span className="text-neutral-500">
                          {s.count} · {pct}%
                        </span>
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
