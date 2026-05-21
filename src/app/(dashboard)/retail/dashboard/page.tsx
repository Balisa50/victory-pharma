"use client";

import useSWR from "swr";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader, PageBody, Panel, StatTile } from "@/components/shared/Editorial";
import type { RetailDashboardData } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((d) => d.data);

export default function RetailDashboard() {
  const { data, isLoading } = useSWR<RetailDashboardData>(
    "/api/dashboard/retail",
    fetcher,
    { refreshInterval: 30000 }
  );

  return (
    <>
      <PageHeader
        eyebrow="Retail account"
        title="Your pharmacy,"
        accent="at a glance"
        description="Live orders, settled receipts, and what you have spent with Victory so far."
      />

      <PageBody>
        {/* Hero spend + quick tiles */}
        <section className="grid gap-5 lg:grid-cols-3">
          <div className="relative overflow-hidden rounded-2xl bg-[hsl(var(--navy))] p-8 text-white lg:col-span-2">
            <span
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[hsl(var(--gold))]/15 blur-[100px]"
            />
            <p className="eyebrow mb-3 text-[hsl(var(--gold))]">Total spending</p>
            <p
              className="display text-white"
              style={{ fontSize: "clamp(40px, 5vw, 60px)" }}
            >
              {isLoading ? "..." : formatCurrency(data?.totalSpending ?? 0)}
            </p>
            <p className="mt-3 text-[13px] font-light text-white/55">
              Across every order placed with Victory Pharmaceutical.
            </p>
          </div>

          <div className="grid gap-5">
            <StatTile
              eyebrow="Active orders"
              value={isLoading ? "..." : String(data?.activeOrders?.length ?? 0)}
              tone="red"
              footnote="In progress right now."
            />
            <StatTile
              eyebrow="Receipts"
              value={isLoading ? "..." : String(data?.recentReceipts?.length ?? 0)}
              tone="gold"
              footnote="Settled and downloadable."
            />
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          {/* Active orders */}
          <Panel
            eyebrow="In progress"
            title="Active"
            accent="orders"
            action={
              <Link
                href="/retail/orders"
                className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--navy))] underline-offset-4 hover:text-[hsl(var(--red))] hover:underline"
              >
                View all
              </Link>
            }
          >
            <ul className="divide-y divide-neutral-100">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <li key={i} className="h-16 animate-pulse bg-neutral-50/60" />
                ))
              ) : (data?.activeOrders?.length ?? 0) === 0 ? (
                <li>
                  <EmptyState message="No active orders. Browse the catalog to place one." />
                </li>
              ) : (
                data!.activeOrders.map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/retail/orders/${o.id}`}
                      className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-[hsl(var(--offwhite))] md:px-7"
                    >
                      <div>
                        <p className="font-mono text-[11.5px] tracking-wide text-neutral-500">
                          #{o.id.slice(-8).toUpperCase()}
                        </p>
                        <p className="mt-1 font-medium text-[hsl(var(--navy))]">
                          {formatCurrency(Number(o.totalAmount))}
                        </p>
                      </div>
                      <StatusBadge status={o.status} />
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </Panel>

          {/* Recent receipts */}
          <Panel
            eyebrow="Settled"
            title="Recent"
            accent="receipts"
            action={
              <Link
                href="/retail/receipts"
                className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--navy))] underline-offset-4 hover:text-[hsl(var(--red))] hover:underline"
              >
                View all
              </Link>
            }
          >
            <ul className="divide-y divide-neutral-100">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <li key={i} className="h-16 animate-pulse bg-neutral-50/60" />
                ))
              ) : (data?.recentReceipts?.length ?? 0) === 0 ? (
                <li>
                  <EmptyState message="No receipts yet. They appear once payments are confirmed." />
                </li>
              ) : (
                data!.recentReceipts.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/retail/receipts/${r.id}`}
                      className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-[hsl(var(--offwhite))] md:px-7"
                    >
                      <div>
                        <p className="font-mono text-[11.5px] tracking-wide text-neutral-500">
                          #{r.id.slice(-8).toUpperCase()}
                        </p>
                        <p className="mt-1 font-medium text-[hsl(var(--navy))]">
                          {formatCurrency(Number(r.totalAmount))}
                        </p>
                      </div>
                      <span className="text-[12px] text-neutral-400">
                        {formatDate(r.generatedAt)}
                      </span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </Panel>
        </section>
      </PageBody>
    </>
  );
}
