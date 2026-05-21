"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader, PageBody, Panel } from "@/components/shared/Editorial";
import type { OrderWithRelations } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((d) => d.data);

const STATUS_FILTERS = [
  "",
  "pending",
  "confirmed",
  "packed",
  "out_for_delivery",
  "delivered",
  "cancelled",
];
const STATUS_LABELS: Record<string, string> = {
  "": "All",
  pending: "Pending",
  confirmed: "Confirmed",
  packed: "Packed",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function WholesaleOrdersPage() {
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = useSWR<{
    orders: OrderWithRelations[];
    total: number;
  }>(
    `/api/orders${statusFilter ? `?status=${statusFilter}` : ""}`,
    fetcher,
    { refreshInterval: 15000 }
  );

  return (
    <>
      <PageHeader
        eyebrow="Fulfilment"
        title="Incoming"
        accent="orders"
        description="Confirm, pack, and dispatch orders from retail partners."
      />

      <PageBody>
        {/* Status filter */}
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.1em] transition-colors ${
                statusFilter === s
                  ? "bg-[hsl(var(--navy))] text-white"
                  : "border border-neutral-200 bg-white text-neutral-500 hover:bg-[hsl(var(--offwhite))]"
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="ed-thead">
                  <th className="px-6 py-3.5 md:px-7">Order</th>
                  <th className="px-4 py-3.5">Pharmacy</th>
                  <th className="px-4 py-3.5">Items</th>
                  <th className="px-4 py-3.5">Total</th>
                  <th className="px-4 py-3.5">Payment</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-6 py-3.5 text-right md:px-7"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-neutral-100">
                      <td colSpan={8} className="h-14 animate-pulse bg-neutral-50/60" />
                    </tr>
                  ))
                ) : (data?.orders?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState message="No orders match this filter." />
                    </td>
                  </tr>
                ) : (
                  data!.orders.map((o) => (
                    <tr key={o.id} className="ed-row">
                      <td className="px-6 py-4 font-mono text-[11.5px] tracking-wide text-neutral-500 md:px-7">
                        #{o.id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-4 py-4">
                        <p className="serif italic text-[hsl(var(--navy))]">
                          {o.retailPharmacy.pharmacyName ?? o.retailPharmacy.name}
                        </p>
                        <p className="text-[11px] text-neutral-400">
                          {o.retailPharmacy.phone}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-neutral-500">
                        {o.orderItems.length}
                      </td>
                      <td className="px-4 py-4 font-medium text-[hsl(var(--navy))]">
                        {formatCurrency(Number(o.totalAmount))}
                      </td>
                      <td className="px-4 py-4">
                        {o.payment ? (
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                              o.payment.status === "confirmed"
                                ? "bg-[hsl(var(--green))]/12 text-[hsl(var(--green))]"
                                : "bg-[hsl(var(--gold))]/15 text-[hsl(var(--gold))]"
                            }`}
                          >
                            {o.payment.status === "confirmed"
                              ? "Confirmed"
                              : "Pending"}
                          </span>
                        ) : (
                          <span className="text-[12px] text-neutral-300">None</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="px-4 py-4 text-[12px] text-neutral-400">
                        {formatDateTime(o.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right md:px-7">
                        <Link
                          href={`/wholesale/orders/${o.id}`}
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
