"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { AlertCircle, TrendingUp, Users, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader, PageBody, Panel, StatTile } from "@/components/shared/Editorial";

type PharmacyDebt = {
  id: string;
  name: string;
  pharmacyName: string | null;
  phone: string;
  email: string;
  location: string | null;
  totalCreditOrdered: number;
  totalPaid: number;
  outstanding: number;
  creditOrderCount: number;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((d) => d.data);

export default function CreditLedgerPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useSWR<PharmacyDebt[]>("/api/credit/pharmacies", fetcher, {
    refreshInterval: 30000,
  });

  const filtered = (data ?? []).filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.pharmacyName ?? "").toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q)
    );
  });

  const totalOutstanding = (data ?? []).reduce((s, p) => s + p.outstanding, 0);
  const debtors = (data ?? []).filter((p) => p.outstanding > 0).length;
  const overdueCount = (data ?? []).filter((p) => p.outstanding > 5000).length;

  return (
    <>
      <PageHeader
        eyebrow="Finance"
        title="Credit"
        accent="ledger"
        description="Track outstanding balances and record payments from retail pharmacy partners."
      />

      <PageBody>
        {/* Stats */}
        <div className="grid gap-5 sm:grid-cols-3">
          <StatTile
            eyebrow="Total outstanding"
            value={isLoading ? "…" : formatCurrency(totalOutstanding)}
            footnote="Across all credit pharmacies."
            tone="red"
          />
          <StatTile
            eyebrow="Active debtors"
            value={isLoading ? "…" : String(debtors)}
            footnote="Pharmacies with unpaid balance."
            tone="navy"
          />
          <StatTile
            eyebrow="High-balance alerts"
            value={isLoading ? "…" : String(overdueCount)}
            footnote="Outstanding > GMD 5,000."
            tone="gold"
          />
        </div>

        <Panel
          eyebrow="All pharmacies"
          title="Credit"
          accent="accounts"
          action={
            <input
              type="search"
              placeholder="Search pharmacy…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 rounded-lg border border-neutral-200 bg-[hsl(var(--offwhite))] px-3 py-1.5 text-[13px] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--navy))]/20"
            />
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="ed-thead">
                  <th className="px-6 py-3.5 md:px-7">Pharmacy</th>
                  <th className="px-4 py-3.5 text-right">Total Credit</th>
                  <th className="px-4 py-3.5 text-right">Total Paid</th>
                  <th className="px-4 py-3.5 text-right">Outstanding</th>
                  <th className="px-4 py-3.5 text-center">Orders</th>
                  <th className="px-6 py-3.5 md:px-7"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-neutral-100">
                      <td colSpan={6} className="h-14 animate-pulse bg-neutral-50/60" />
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState message="No pharmacies with credit orders yet." />
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="ed-row">
                      <td className="px-6 py-4 md:px-7">
                        <p className="serif italic text-[hsl(var(--navy))]">
                          {p.pharmacyName ?? p.name}
                        </p>
                        <p className="text-[11px] text-neutral-400">{p.email}</p>
                      </td>
                      <td className="px-4 py-4 text-right text-neutral-600">
                        {formatCurrency(p.totalCreditOrdered)}
                      </td>
                      <td className="px-4 py-4 text-right text-[hsl(var(--green))]">
                        {formatCurrency(p.totalPaid)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {p.outstanding > 0 ? (
                          <span className="flex items-center justify-end gap-1.5 font-semibold text-[hsl(var(--red-2))]">
                            {p.outstanding > 5000 && (
                              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            )}
                            {formatCurrency(p.outstanding)}
                          </span>
                        ) : (
                          <span className="text-[hsl(var(--green))]">Settled</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center text-neutral-500">
                        {p.creditOrderCount}
                      </td>
                      <td className="px-6 py-4 text-right md:px-7">
                        <Link
                          href={`/wholesale/credit/${p.id}`}
                          className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--navy))] underline-offset-4 hover:text-[hsl(var(--red))] hover:underline"
                        >
                          Statement
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
