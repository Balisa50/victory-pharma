"use client";

import useSWR from "swr";
import dynamic from "next/dynamic";
import { formatCurrency } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import type { WholesaleDashboardData } from "@/types";
import { useMemo } from "react";

// Charts (recharts) load on demand so they stay out of the initial bundle.
const RevenueSparkline = dynamic(
  () => import("@/components/shared/RevenueChart").then((m) => m.RevenueSparkline),
  { ssr: false }
);
const RevenueArea = dynamic(
  () => import("@/components/shared/RevenueChart").then((m) => m.RevenueArea),
  { ssr: false, loading: () => <div className="h-[240px] animate-pulse rounded bg-neutral-50" /> }
);

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((d) => d.data);

export default function WholesaleDashboard() {
  const { data, isLoading } = useSWR<WholesaleDashboardData>(
    "/api/dashboard/wholesale",
    fetcher,
    { refreshInterval: 30000 }
  );

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "morning";
    if (h < 17) return "afternoon";
    return "evening";
  }, []);

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    []
  );

  const chart = data?.revenueChart ?? [];
  const last = chart[chart.length - 1]?.revenue ?? 0;
  const prev = chart[chart.length - 2]?.revenue ?? 0;
  const delta = prev === 0 ? 0 : ((last - prev) / prev) * 100;

  return (
    <div className="min-h-screen bg-[hsl(var(--offwhite))]">
      {/* ── EDITORIAL HEADER ── */}
      <header className="border-b border-[hsl(var(--navy))]/10 bg-white">
        <div className="px-8 py-9 md:px-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-2 text-[hsl(var(--red-2))]">
                Wholesale console · {today}
              </p>
              <h1
                className="display text-[hsl(var(--navy))]"
                style={{ fontSize: "clamp(30px, 3.5vw, 44px)" }}
              >
                Good {greeting}, <em>Victory</em>.
              </h1>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
                Live
              </span>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--green))] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[hsl(var(--green))]" />
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-8 px-8 py-8 md:px-12">
        {/* ── ASYMMETRIC HERO STATS ── */}
        <section className="grid gap-5 lg:grid-cols-3">
          {/* Primary: Revenue */}
          <div className="relative overflow-hidden rounded-2xl bg-[hsl(var(--navy))] p-8 text-white lg:col-span-2">
            <span
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[hsl(var(--gold))]/15 blur-[100px]"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -left-12 -bottom-16 h-56 w-56 rounded-full bg-[hsl(var(--red))]/15 blur-[90px]"
            />

            <div className="relative grid grid-cols-1 gap-8 md:grid-cols-[1.1fr_1fr] md:items-end">
              <div>
                <p className="eyebrow mb-3 text-[hsl(var(--gold))]">Total revenue</p>
                <p
                  className="display text-white"
                  style={{ fontSize: "clamp(44px, 5.5vw, 68px)" }}
                >
                  {isLoading ? "..." : formatCurrency(data?.totalRevenue ?? 0)}
                </p>
                <p className="mt-3 text-[13px] font-light text-white/55">
                  {delta === 0
                    ? "Steady against yesterday."
                    : delta > 0
                    ? `Up ${delta.toFixed(1)}% vs. yesterday.`
                    : `Down ${Math.abs(delta).toFixed(1)}% vs. yesterday.`}
                </p>
              </div>

              {/* Inline sparkline */}
              <div className="-mb-2 h-24">
                {chart.length > 0 && <RevenueSparkline data={chart} />}
              </div>
            </div>
          </div>

          {/* Secondary: Pending */}
          <div className="rounded-2xl bg-white p-7 ring-1 ring-[hsl(var(--navy))]/5">
            <p className="eyebrow mb-3 text-[hsl(var(--red-2))]">Pending payments</p>
            <p
              className="display text-[hsl(var(--navy))]"
              style={{ fontSize: "clamp(36px, 3vw, 44px)" }}
            >
              {isLoading ? "..." : formatCurrency(data?.pendingPayments ?? 0)}
            </p>
            <div className="mt-5 border-t border-neutral-100 pt-4">
              <p className="text-[12px] font-light leading-relaxed text-neutral-500">
                Awaiting settlement from retail partners.
              </p>
            </div>
          </div>
        </section>

        {/* ── COMPACT METRICS ROW ── */}
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <MetricTile
            eyebrow="Total orders"
            value={String(data?.totalOrders ?? 0)}
            tone="navy"
            footnote="Lifetime, across all partners."
            isLoading={isLoading}
          />
          <MetricTile
            eyebrow="Low stock"
            value={String(data?.lowStockCount ?? 0)}
            tone="red"
            footnote="Items below their reorder threshold."
            isLoading={isLoading}
          />
          <MetricTile
            eyebrow="Active pharmacies"
            value={String(
              new Set(data?.recentOrders?.map((o) => o.retailPharmacy.id)).size
            )}
            tone="gold"
            footnote="Ordering in the last 30 days."
            isLoading={isLoading}
          />
        </section>

        {/* ── REVENUE NARRATIVE + LOW STOCK ── */}
        <section className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          {/* Revenue chart */}
          <article className="overflow-hidden rounded-2xl bg-white ring-1 ring-[hsl(var(--navy))]/5">
            <div className="flex items-center justify-between border-b border-neutral-100 px-7 py-5">
              <div>
                <p className="eyebrow mb-1 text-[hsl(var(--red-2))]">Last 7 days</p>
                <h2 className="serif text-[18px] text-[hsl(var(--navy))]">
                  Revenue, <em className="text-[hsl(var(--orange))]">day by day</em>
                </h2>
              </div>
            </div>
            <div className="px-4 py-6">
              {isLoading ? (
                <div className="h-56 animate-pulse rounded bg-neutral-50" />
              ) : chart.length === 0 ? (
                <div className="py-12">
                  <EmptyState message="No revenue recorded yet. Orders will appear here as they settle." />
                </div>
              ) : (
                <RevenueArea data={chart} />
              )}
            </div>
          </article>

          {/* Low stock list */}
          <article className="overflow-hidden rounded-2xl bg-white ring-1 ring-[hsl(var(--navy))]/5">
            <div className="border-b border-neutral-100 px-7 py-5">
              <p className="eyebrow mb-1 text-[hsl(var(--red-2))]">Watchlist</p>
              <h2 className="serif text-[18px] text-[hsl(var(--navy))]">
                Low <em className="text-[hsl(var(--red-2))]">stock</em>
              </h2>
            </div>
            <ul className="divide-y divide-neutral-100">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <li key={i} className="h-14 animate-pulse bg-neutral-50/50" />
                ))
              ) : (data?.lowStockProducts?.length ?? 0) === 0 ? (
                <li className="px-7 py-10">
                  <EmptyState message="Stock is healthy. Nothing to flag." />
                </li>
              ) : (
                data?.lowStockProducts.slice(0, 6).map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between px-7 py-4 transition-colors hover:bg-[hsl(var(--offwhite))]"
                  >
                    <div>
                      <p className="text-[13.5px] font-medium text-[hsl(var(--navy))]">
                        {p.name}
                      </p>
                      <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-neutral-400">
                        {p.category}
                      </p>
                    </div>
                    <span className="serif text-[20px] italic text-[hsl(var(--red-2))]">
                      {p.stockQuantity}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </article>
        </section>

        {/* ── RECENT ORDERS ── */}
        <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-[hsl(var(--navy))]/5">
          <div className="flex items-center justify-between border-b border-neutral-100 px-7 py-5">
            <div>
              <p className="eyebrow mb-1 text-[hsl(var(--red-2))]">Activity</p>
              <h2 className="serif text-[18px] text-[hsl(var(--navy))]">
                Recent <em className="text-[hsl(var(--orange))]">orders</em>
              </h2>
            </div>
            <a
              href="/wholesale/orders"
              className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--navy))] underline-offset-4 hover:text-[hsl(var(--red))] hover:underline"
            >
              View all
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="border-b border-neutral-100 text-left text-[10.5px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                  <th className="px-7 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Pharmacy</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-7 py-3 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-neutral-100">
                      <td colSpan={4} className="h-14 animate-pulse bg-neutral-50/50" />
                    </tr>
                  ))
                ) : (data?.recentOrders?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <div className="py-14">
                        <EmptyState message="No orders yet. Your first one will land here in real time." />
                      </div>
                    </td>
                  </tr>
                ) : (
                  data?.recentOrders.map((o) => (
                    <tr
                      key={o.id}
                      className="border-b border-neutral-100 transition-colors hover:bg-[hsl(var(--offwhite))]"
                    >
                      <td className="px-7 py-4 font-mono text-[11.5px] tracking-wide text-neutral-500">
                        #{o.id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-4 py-4">
                        <span className="serif italic text-[hsl(var(--navy))]">
                          {o.retailPharmacy.pharmacyName ?? o.retailPharmacy.name}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-medium text-[hsl(var(--navy))]">
                        {formatCurrency(Number(o.totalAmount))}
                      </td>
                      <td className="px-7 py-4 text-right">
                        <StatusBadge status={o.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricTile({
  eyebrow,
  value,
  footnote,
  tone,
  isLoading,
}: {
  eyebrow: string;
  value: string;
  footnote: string;
  tone: "navy" | "red" | "gold";
  isLoading: boolean;
}) {
  const accent =
    tone === "red"
      ? "text-[hsl(var(--red-2))]"
      : tone === "gold"
      ? "text-[hsl(var(--gold))]"
      : "text-[hsl(var(--red-2))]";
  const numberColor =
    tone === "red" ? "text-[hsl(var(--red-2))]" : "text-[hsl(var(--navy))]";
  const railColor =
    tone === "red"
      ? "bg-[hsl(var(--red-2))]"
      : tone === "gold"
      ? "bg-[hsl(var(--gold))]"
      : "bg-[hsl(var(--navy-3))]";

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-6 ring-1 ring-[hsl(var(--navy))]/5">
      <span className={`absolute inset-y-5 left-0 w-[3px] rounded-r-full ${railColor}`} />
      <div className="pl-3">
        <p className={`eyebrow mb-2 ${accent}`}>{eyebrow}</p>
        <p
          className={`display ${numberColor}`}
          style={{ fontSize: "clamp(30px, 2.5vw, 38px)" }}
        >
          {isLoading ? "..." : value}
        </p>
        <p className="mt-3 text-[12px] font-light leading-relaxed text-neutral-500">
          {footnote}
        </p>
      </div>
    </div>
  );
}
