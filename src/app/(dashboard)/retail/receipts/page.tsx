"use client";

import useSWR from "swr";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader, PageBody, Panel } from "@/components/shared/Editorial";
import type { Receipt } from "@/types";

const fetcher = (url: string) =>
  fetch(url)
    .then((r) => r.json())
    .then((d) => d.data?.recentReceipts ?? []);

export default function RetailReceiptsPage() {
  const { data, isLoading } = useSWR<
    (Receipt & {
      order: { id: string; createdAt: Date; totalAmount: unknown };
    })[]
  >("/api/dashboard/retail", fetcher);

  return (
    <>
      <PageHeader
        eyebrow="Settled payments"
        title="Your"
        accent="receipts"
        description="Confirmed payments, each with a downloadable PDF receipt."
      />

      <PageBody>
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="ed-thead">
                  <th className="px-6 py-3.5 md:px-7">Receipt</th>
                  <th className="px-4 py-3.5">Order</th>
                  <th className="px-4 py-3.5">Amount</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-6 py-3.5 text-right md:px-7"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-neutral-100">
                      <td colSpan={5} className="h-14 animate-pulse bg-neutral-50/60" />
                    </tr>
                  ))
                ) : (data?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState message="No receipts yet. They appear once a payment is confirmed." />
                    </td>
                  </tr>
                ) : (
                  data!.map((r) => (
                    <tr key={r.id} className="ed-row">
                      <td className="px-6 py-4 font-mono text-[11.5px] tracking-wide text-neutral-500 md:px-7">
                        #{r.id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-4 py-4 font-mono text-[11.5px] tracking-wide text-neutral-400">
                        #{r.orderId.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-4 py-4 font-medium text-[hsl(var(--navy))]">
                        {formatCurrency(Number(r.totalAmount))}
                      </td>
                      <td className="px-4 py-4 text-[12px] text-neutral-400">
                        {formatDate(r.generatedAt)}
                      </td>
                      <td className="px-6 py-4 text-right md:px-7">
                        <Link
                          href={`/retail/receipts/${r.id}`}
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
