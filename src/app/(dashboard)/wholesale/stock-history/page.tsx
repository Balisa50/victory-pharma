"use client";

import { useState } from "react";
import useSWR from "swr";
import { formatDateTime } from "@/lib/utils";
import { PageHeader, PageBody, Panel } from "@/components/shared/Editorial";
import { EmptyState } from "@/components/shared/EmptyState";

type Movement = {
  id: string;
  productId: string;
  actionType: "STOCK_ADD" | "STOCK_TRANSFER" | "ORDER_DEDUCTION" | "ORDER_VOID" | "MANUAL_ADJUST";
  quantity: number;
  note: string | null;
  createdAt: string;
  product: { id: string; name: string; category: string };
};

type ApiData = { movements: Movement[]; total: number; pages: number };

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((d) => d.data as ApiData);

const ACTION_LABEL: Record<Movement["actionType"], string> = {
  STOCK_ADD: "Received",
  STOCK_TRANSFER: "Transfer → Sales",
  ORDER_DEDUCTION: "Order",
  ORDER_VOID: "Voided order",
  MANUAL_ADJUST: "Adjustment",
};

const ACTION_TONE: Record<Movement["actionType"], string> = {
  STOCK_ADD: "text-[hsl(var(--green))]",
  STOCK_TRANSFER: "text-[hsl(var(--navy))]",
  ORDER_DEDUCTION: "text-[hsl(var(--red-2))]",
  ORDER_VOID: "text-[hsl(var(--gold))]",
  MANUAL_ADJUST: "text-neutral-500",
};

export default function StockHistoryPage() {
  const [actionType, setActionType] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [productId, setProductId] = useState<string>("");

  const params = new URLSearchParams();
  if (actionType) params.set("actionType", actionType);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (productId) params.set("productId", productId);
  params.set("limit", "200");

  const { data, isLoading } = useSWR(
    `/api/stock-movements?${params.toString()}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  // Pull products list for the filter dropdown.
  const { data: products } = useSWR<{ id: string; name: string }[]>(
    "/api/products",
    (url: string) =>
      fetch(url)
        .then((r) => r.json())
        .then((d) => d.data?.products ?? d.data ?? [])
  );

  const movements = data?.movements ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Audit trail"
        title="Stock"
        accent="history"
      />

      <PageBody>
        <Panel eyebrow="Filter" title="Refine" accent="results">
          <div className="grid gap-3 px-6 py-5 md:grid-cols-4 md:px-7">
            <div>
              <label className="eyebrow mb-1 block text-[hsl(var(--red-2))]">
                Action
              </label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="w-full rounded-md border border-neutral-200 px-3 py-2 text-[13px]"
              >
                <option value="">All actions</option>
                <option value="STOCK_ADD">Received</option>
                <option value="STOCK_TRANSFER">Transfer to sales</option>
                <option value="ORDER_DEDUCTION">Order deduction</option>
                <option value="ORDER_VOID">Voided order</option>
                <option value="MANUAL_ADJUST">Manual adjustment</option>
              </select>
            </div>
            <div>
              <label className="eyebrow mb-1 block text-[hsl(var(--red-2))]">
                Product
              </label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full rounded-md border border-neutral-200 px-3 py-2 text-[13px]"
              >
                <option value="">All products</option>
                {(Array.isArray(products) ? products : []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="eyebrow mb-1 block text-[hsl(var(--red-2))]">
                From
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full rounded-md border border-neutral-200 px-3 py-2 text-[13px]"
              />
            </div>
            <div>
              <label className="eyebrow mb-1 block text-[hsl(var(--red-2))]">
                To
              </label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-md border border-neutral-200 px-3 py-2 text-[13px]"
              />
            </div>
          </div>
        </Panel>

        <div className="h-5" />

        <Panel eyebrow="Ledger" title="Movement" accent="log">
          {isLoading ? (
            <div className="h-64 animate-pulse" />
          ) : movements.length === 0 ? (
            <div className="px-7 py-10">
              <EmptyState message="No movements yet. Try adjusting the filters above." />
            </div>
          ) : (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="ed-thead">
                  <th className="px-6 py-3 text-left md:px-7">When</th>
                  <th className="px-4 py-3 text-left">Action</th>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-right">Units</th>
                  <th className="px-6 py-3 text-left md:px-7">Note</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id} className="border-b border-neutral-100">
                    <td className="px-6 py-3 text-neutral-500 md:px-7">
                      {formatDateTime(m.createdAt)}
                    </td>
                    <td className={`px-4 py-3 font-medium ${ACTION_TONE[m.actionType]}`}>
                      {ACTION_LABEL[m.actionType]}
                    </td>
                    <td className="px-4 py-3 text-[hsl(var(--navy))]">
                      {m.product?.name ?? "—"}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-medium ${
                        m.quantity >= 0
                          ? "text-[hsl(var(--green))]"
                          : "text-[hsl(var(--red-2))]"
                      }`}
                    >
                      {m.quantity >= 0 ? "+" : ""}
                      {m.quantity}
                    </td>
                    <td className="px-6 py-3 text-neutral-500 md:px-7">
                      {m.note ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </PageBody>
    </>
  );
}
