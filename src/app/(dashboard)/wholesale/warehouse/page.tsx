"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { Plus, SlidersHorizontal, ArrowRightLeft, AlertTriangle } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";
import { formatStockBreakdown } from "@/lib/packaging";
import { PageHeader, PageBody, Panel } from "@/components/shared/Editorial";
import { EmptyState } from "@/components/shared/EmptyState";
import { AddStockModal } from "./components/AddStockModal";
import { AdjustStockModal } from "./components/AdjustStockModal";
import { TransferModal } from "./components/TransferModal";
import type { Product } from "@/types";

type StockMovementRow = {
  id: string;
  productId: string;
  actionType: "STOCK_ADD" | "STOCK_TRANSFER" | "ORDER_DEDUCTION" | "MANUAL_ADJUST";
  quantity: number;
  note: string | null;
  createdAt: string;
  product: { name: string };
};

type WarehouseData = { products: Product[]; movements: StockMovementRow[] };

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((d) => d.data as WarehouseData);

const ACTION_LABELS: Record<StockMovementRow["actionType"], string> = {
  STOCK_ADD: "Received",
  STOCK_TRANSFER: "Transfer → Sales",
  ORDER_DEDUCTION: "Order",
  MANUAL_ADJUST: "Adjustment",
};

export default function WarehousePage() {
  const { data, isLoading, mutate } = useSWR("/api/warehouse/stock", fetcher, {
    refreshInterval: 20000,
  });

  const [adding, setAdding] = useState<Product | null>(null);
  const [adjusting, setAdjusting] = useState<Product | null>(null);
  const [transferring, setTransferring] = useState<Product | null>(null);

  const products = data?.products ?? [];
  const movements = data?.movements ?? [];

  // Products expiring within 60 days (or already past).
  const expiring = useMemo(() => {
    const cutoff = Date.now() + 60 * 24 * 60 * 60 * 1000;
    return products
      .filter((p) => p.expiryDate)
      .map((p) => {
        const t = new Date(p.expiryDate as Date | string).getTime();
        const days = Math.ceil((t - Date.now()) / (24 * 60 * 60 * 1000));
        return { product: p, days, t };
      })
      .filter(({ t }) => t <= cutoff)
      .sort((a, b) => a.t - b.t);
  }, [products]);

  return (
    <>
      <PageHeader
        eyebrow="Inventory"
        title="The"
        accent="warehouse"
        description="Bulk warehouse stock is held separately from sales inventory. Move stock to sales with a logged transfer."
      />

      <PageBody>
        {/* Stock table */}
        <Panel eyebrow="Two-pool stock" title="Product" accent="warehouse">
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="ed-thead">
                  <th className="px-6 py-3.5 md:px-7">Product</th>
                  <th className="px-4 py-3.5">Conversions</th>
                  <th className="px-4 py-3.5">Warehouse</th>
                  <th className="px-4 py-3.5">Sales (sellable)</th>
                  <th className="px-4 py-3.5">Threshold</th>
                  <th className="px-6 py-3.5 text-right md:px-7">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-neutral-100">
                      <td colSpan={6} className="h-14 animate-pulse bg-neutral-50/60" />
                    </tr>
                  ))
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState message="No products yet. Add products first, then stock them here." />
                    </td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const low = p.stockUnits <= p.lowStockThreshold;
                    return (
                      <tr key={p.id} className="ed-row">
                        <td className="px-6 py-4 md:px-7">
                          <span className="serif italic text-[hsl(var(--navy))]">
                            {p.name}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-[12px] text-neutral-500">
                          <p>{p.unitsPerBottle} units / bottle</p>
                          <p className="text-neutral-400">
                            {p.bottlesPerCarton} bottles / carton
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-[hsl(var(--navy))]">
                            {formatStockBreakdown({ ...p, stockUnits: p.warehouseUnits })}
                          </span>
                          <p className="text-[11px] text-neutral-400">
                            {p.warehouseUnits} units
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={
                              low
                                ? "font-semibold text-[hsl(var(--red-2))]"
                                : "text-[hsl(var(--navy))]"
                            }
                          >
                            {formatStockBreakdown(p)}
                          </span>
                          <p className="text-[11px] text-neutral-400">
                            {p.stockUnits} units
                          </p>
                        </td>
                        <td className="px-4 py-4 text-neutral-500">
                          {p.lowStockThreshold} units
                        </td>
                        <td className="px-6 py-4 md:px-7">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => setAdding(p)}
                              className="inline-flex items-center gap-1 rounded-md bg-[hsl(var(--navy))] px-2.5 py-1.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-[hsl(var(--navy-2))]"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add
                            </button>
                            <button
                              onClick={() => setTransferring(p)}
                              disabled={p.warehouseUnits <= 0}
                              className="inline-flex items-center gap-1 rounded-md bg-[hsl(var(--green))] px-2.5 py-1.5 text-[11.5px] font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-40"
                            >
                              <ArrowRightLeft className="h-3.5 w-3.5" />
                              Transfer
                            </button>
                            <button
                              onClick={() => setAdjusting(p)}
                              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11.5px] font-semibold text-[hsl(var(--navy))] transition-colors hover:bg-[hsl(var(--navy))]/8"
                            >
                              <SlidersHorizontal className="h-3.5 w-3.5" />
                              Adjust
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Expiring soon */}
        <Panel
          eyebrow="Watchlist"
          title="Expiring"
          accent="soon"
          action={
            <span className="text-[11px] uppercase tracking-[0.14em] text-neutral-400">
              Next 60 days
            </span>
          }
        >
          {expiring.length === 0 ? (
            <div className="px-6 py-10 text-center text-[13px] font-light text-neutral-500 md:px-7">
              No products are expiring in the next 60 days.
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {expiring.map(({ product, days }) => {
                const expired = days < 0;
                const urgent = !expired && days <= 14;
                return (
                  <li
                    key={product.id}
                    className="flex items-center justify-between gap-3 px-6 py-4 md:px-7"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="serif italic text-[hsl(var(--navy))]">
                        {product.name}
                      </p>
                      <p className="mt-0.5 text-[11.5px] uppercase tracking-[0.12em] text-neutral-400">
                        {product.category} ·{" "}
                        {formatDate(product.expiryDate as Date | string)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                        expired
                          ? "bg-[hsl(var(--red))]/15 text-[hsl(var(--red))]"
                          : urgent
                          ? "bg-[hsl(var(--red-2))]/12 text-[hsl(var(--red-2))]"
                          : "bg-[hsl(var(--gold))]/15 text-[hsl(var(--gold))]"
                      }`}
                    >
                      <AlertTriangle className="h-3 w-3" />
                      {expired
                        ? `Expired ${Math.abs(days)}d ago`
                        : `${days}d left`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        {/* Movement log */}
        <Panel eyebrow="Audit trail" title="Stock" accent="movements">
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="ed-thead">
                  <th className="px-6 py-3.5 md:px-7">When</th>
                  <th className="px-4 py-3.5">Product</th>
                  <th className="px-4 py-3.5">Action</th>
                  <th className="px-4 py-3.5">Change</th>
                  <th className="px-6 py-3.5 md:px-7">Note</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-neutral-100">
                      <td colSpan={5} className="h-12 animate-pulse bg-neutral-50/60" />
                    </tr>
                  ))
                ) : movements.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState message="No stock movements recorded yet." />
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => (
                    <tr key={m.id} className="ed-row">
                      <td className="px-6 py-3.5 text-[12px] text-neutral-400 md:px-7">
                        {formatDateTime(m.createdAt)}
                      </td>
                      <td className="px-4 py-3.5 text-[hsl(var(--navy))]">
                        {m.product.name}
                      </td>
                      <td className="px-4 py-3.5 text-[11px] uppercase tracking-[0.12em] text-neutral-500">
                        {ACTION_LABELS[m.actionType] ?? m.actionType}
                      </td>
                      <td
                        className={`px-4 py-3.5 font-semibold ${
                          m.quantity >= 0
                            ? "text-[hsl(var(--green))]"
                            : "text-[hsl(var(--red-2))]"
                        }`}
                      >
                        {m.quantity >= 0 ? "+" : ""}
                        {m.quantity}
                      </td>
                      <td className="px-6 py-3.5 text-[12.5px] text-neutral-500 md:px-7">
                        {m.note ?? "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </PageBody>

      {adding && (
        <AddStockModal
          product={adding}
          onClose={() => setAdding(null)}
          onDone={() => {
            setAdding(null);
            mutate();
          }}
        />
      )}
      {transferring && (
        <TransferModal
          product={transferring}
          onClose={() => setTransferring(null)}
          onDone={() => {
            setTransferring(null);
            mutate();
          }}
        />
      )}
      {adjusting && (
        <AdjustStockModal
          product={adjusting}
          onClose={() => setAdjusting(null)}
          onDone={() => {
            setAdjusting(null);
            mutate();
          }}
        />
      )}
    </>
  );
}
