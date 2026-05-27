"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { formatCurrency, formatDate, PAYMENT_METHOD_LABELS } from "@/lib/utils";
import { PageHeader, PageBody, Panel, StatTile, Modal } from "@/components/shared/Editorial";
import { EmptyState } from "@/components/shared/EmptyState";

type CreditOrder = {
  id: string;
  totalAmount: number;
  status: string;
  notes: string | null;
  createdAt: string;
  orderItems: { productName: string; quantity: number; unitPrice: number }[];
};

type CreditPayment = {
  id: string;
  amount: number;
  method: string;
  note: string | null;
  createdAt: string;
};

type StatementData = {
  pharmacy: {
    id: string;
    name: string;
    pharmacyName: string | null;
    phone: string;
    email: string;
    location: string | null;
  };
  creditOrders: CreditOrder[];
  creditPayments: CreditPayment[];
  totalCreditOrdered: number;
  totalPaid: number;
  outstanding: number;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((d) => d.data);

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

export default function PharmacyStatementPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, mutate } = useSWR<StatementData>(
    `/api/credit/pharmacies/${id}`,
    fetcher
  );

  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payNote, setPayNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function recordPayment() {
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/credit/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retailPharmacyId: id, amount, method: payMethod, note: payNote || undefined }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success("Payment recorded");
      setShowPayModal(false);
      setPayAmount("");
      setPayNote("");
      mutate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to record payment");
    } finally {
      setSaving(false);
    }
  }

  const pharmName = data?.pharmacy.pharmacyName ?? data?.pharmacy.name ?? "Pharmacy";

  return (
    <>
      <PageHeader
        eyebrow="Credit ledger"
        title={pharmName}
        accent="statement"
        back={{ href: "/wholesale/credit", label: "Back to ledger" }}
        action={
          <button
            onClick={() => setShowPayModal(true)}
            className="rounded-lg bg-[hsl(var(--navy))] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[hsl(var(--navy-3))]"
          >
            Record payment
          </button>
        }
      />

      <PageBody>
        {/* Summary stats */}
        <div className="grid gap-5 sm:grid-cols-3">
          <StatTile
            eyebrow="Total credit taken"
            value={isLoading ? "…" : formatCurrency(data?.totalCreditOrdered ?? 0)}
            tone="navy"
          />
          <StatTile
            eyebrow="Total paid"
            value={isLoading ? "…" : formatCurrency(data?.totalPaid ?? 0)}
            tone="green"
          />
          <StatTile
            eyebrow="Outstanding balance"
            value={isLoading ? "…" : formatCurrency(data?.outstanding ?? 0)}
            footnote={
              (data?.outstanding ?? 0) === 0
                ? "Account is fully settled."
                : "Amount still owed."
            }
            tone={(data?.outstanding ?? 0) > 0 ? "red" : "green"}
          />
        </div>

        {/* Pharmacy info */}
        {data && (
          <div className="rounded-2xl bg-white px-6 py-5 ring-1 ring-[hsl(var(--navy))]/5">
            <p className="eyebrow mb-2 text-[hsl(var(--red-2))]">Contact</p>
            <div className="grid gap-1 text-[13.5px] text-neutral-600 sm:grid-cols-2">
              <span>📞 {data.pharmacy.phone}</span>
              <span>✉ {data.pharmacy.email}</span>
              {data.pharmacy.location && <span>📍 {data.pharmacy.location}</span>}
            </div>
          </div>
        )}

        {/* Credit orders */}
        <Panel eyebrow="Purchases on account" title="Credit" accent="orders">
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="ed-thead">
                  <th className="px-6 py-3.5 md:px-7">Order</th>
                  <th className="px-4 py-3.5">Items</th>
                  <th className="px-4 py-3.5 text-right">Amount</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-6 py-3.5 md:px-7">Date</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-neutral-100">
                      <td colSpan={5} className="h-12 animate-pulse bg-neutral-50/60" />
                    </tr>
                  ))
                ) : (data?.creditOrders?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState message="No credit orders for this pharmacy." />
                    </td>
                  </tr>
                ) : (
                  data!.creditOrders.map((o) => (
                    <tr key={o.id} className="ed-row">
                      <td className="px-6 py-3.5 font-mono text-[11.5px] text-neutral-500 md:px-7">
                        #{o.id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3.5 text-neutral-500">
                        {o.orderItems.map((i) => i.productName).join(", ")}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-[hsl(var(--navy))]">
                        {formatCurrency(Number(o.totalAmount))}
                      </td>
                      <td className="px-4 py-3.5 capitalize text-neutral-500">
                        {o.status.replace(/_/g, " ")}
                      </td>
                      <td className="px-6 py-3.5 text-[12px] text-neutral-400 md:px-7">
                        {formatDate(o.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Payment history */}
        <Panel eyebrow="Payments received" title="Payment" accent="history">
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="ed-thead">
                  <th className="px-6 py-3.5 md:px-7">Date</th>
                  <th className="px-4 py-3.5 text-right">Amount</th>
                  <th className="px-4 py-3.5">Method</th>
                  <th className="px-6 py-3.5 md:px-7">Notes</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b border-neutral-100">
                      <td colSpan={4} className="h-12 animate-pulse bg-neutral-50/60" />
                    </tr>
                  ))
                ) : (data?.creditPayments?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <EmptyState message="No payments recorded yet." />
                    </td>
                  </tr>
                ) : (
                  data!.creditPayments.map((p) => (
                    <tr key={p.id} className="ed-row">
                      <td className="px-6 py-3.5 text-[12px] text-neutral-400 md:px-7">
                        {formatDate(p.createdAt)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-[hsl(var(--green))]">
                        {formatCurrency(Number(p.amount))}
                      </td>
                      <td className="px-4 py-3.5 text-neutral-500">
                        {PAYMENT_METHOD_LABELS[p.method] ?? p.method}
                      </td>
                      <td className="px-6 py-3.5 text-[12px] text-neutral-400 md:px-7">
                        {p.note ?? "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </PageBody>

      {/* Record payment modal */}
      {showPayModal && (
        <Modal
          eyebrow="Credit management"
          title="Record payment"
          accent="received"
          onClose={() => setShowPayModal(false)}
        >
          <div className="space-y-4 px-6 py-5">
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                Amount (GMD)
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3.5 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--navy))]/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                Payment method
              </label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3.5 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--navy))]/20"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                Note (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Partial payment for Nov invoice"
                value={payNote}
                onChange={(e) => setPayNote(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3.5 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--navy))]/20"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4">
            <button
              onClick={() => setShowPayModal(false)}
              className="rounded-lg px-4 py-2 text-[13px] font-medium text-neutral-500 hover:bg-[hsl(var(--offwhite))]"
            >
              Cancel
            </button>
            <button
              onClick={recordPayment}
              disabled={saving}
              className="rounded-lg bg-[hsl(var(--navy))] px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[hsl(var(--navy-3))] disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save payment"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
