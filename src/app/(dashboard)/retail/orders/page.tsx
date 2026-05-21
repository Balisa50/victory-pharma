"use client";

import useSWR from "swr";
import Link from "next/link";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader, PageBody, Panel } from "@/components/shared/Editorial";
import type { OrderWithRelations } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((d) => d.data);

export default function RetailOrdersPage() {
  const { data, isLoading } = useSWR<{ orders: OrderWithRelations[] }>(
    "/api/orders",
    fetcher,
    { refreshInterval: 15000 }
  );

  return (
    <>
      <PageHeader
        eyebrow="Order history"
        title="My"
        accent="orders"
        description="Every order you have placed with Victory, newest first."
      />

      <PageBody>
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="ed-thead">
                  <th className="px-6 py-3.5 md:px-7">Order</th>
                  <th className="px-4 py-3.5">Items</th>
                  <th className="px-4 py-3.5">Total</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-6 py-3.5 text-right md:px-7"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-neutral-100">
                      <td colSpan={6} className="h-14 animate-pulse bg-neutral-50/60" />
                    </tr>
                  ))
                ) : (data?.orders?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState message="No orders yet. Browse the catalog to place your first order." />
                    </td>
                  </tr>
                ) : (
                  data!.orders.map((o) => (
                    <tr key={o.id} className="ed-row">
                      <td className="px-6 py-4 font-mono text-[11.5px] tracking-wide text-neutral-500 md:px-7">
                        #{o.id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-4 py-4 text-neutral-500">
                        {o.orderItems.length} item
                        {o.orderItems.length !== 1 ? "s" : ""}
                      </td>
                      <td className="px-4 py-4 font-medium text-[hsl(var(--navy))]">
                        {formatCurrency(Number(o.totalAmount))}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="px-4 py-4 text-[12px] text-neutral-400">
                        {formatDateTime(o.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right md:px-7">
                        <Link
                          href={`/retail/orders/${o.id}`}
                          className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--navy))] underline-offset-4 hover:text-[hsl(var(--red))] hover:underline"
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
        </Panel>
      </PageBody>
    </>
  );
}
