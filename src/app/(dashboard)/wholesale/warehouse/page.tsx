"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus, SlidersHorizontal } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { formatStockBreakdown } from "@/lib/packaging";
import { PageHeader, PageBody, Panel } from "@/components/shared/Editorial";
import { EmptyState } from "@/components/shared/EmptyState";
import { AddStockModal } from "./components/AddStockModal";
import { AdjustStockModal } from "./components/AdjustStockModal";
import type { Product } from "@/types";

type StockMovementRow = {
  id: string;
  productId: string;
  actionType: "STOCK_ADD" | "ORDER_DEDUCTION" | "MANUAL_ADJUST";
  quantity: number;
  note: string | null;
  createdAt: string;
  product: { name: string };
};

type WarehouseData = { products: Product[]; movements: StockMovementRow[] };

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((d) => d.data as WarehouseData);

const ACTION_LABELS: Record<StockMovementRow["actionType"], string> = {
  STOCK_ADD: "Stock added",
  ORDER_DEDUCTION: "Order",
  MANUAL_ADJUST: "Adjustment",
};

export default function WarehousePage() {
  const { data, isLoading, mutate } = useSWR("/api/warehouse/stock", fetcher, {
    refreshInterval: 20000,
  });

  const [adding, setAdding] = useState<Product | null>(null);
  const [adjusting, setAdjusting] = useState<Product | null>(null);

  const products = data?.products ?? [];
  const movements = data?.movements ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Inventory"
        title="The"
        accent="warehouse"
        description="Bulk stock held in base units. Add cartons, correct counts, and audit every movement."
      />

      <PageBody>
        {/* Stock table */}
        <Panel eyebrow="Live stock" title="Product" accent="warehouse">
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="ed-thead">
                  <th className="px-6 py-3.5 md:px-7">Product</th>
                  <th className="px-4 py-3.5">Conversions</th>
                  <th className="px-4 py-3.5">In stock</th>
                  <th className="px-4 py-3.5">Threshold</th>
                  <th className="px-6 py-3.5 text-right md:px-7">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-neutral-100">
                      <td colSpan={5} className="h-14 animate-pulse bg-neutral-50/60" />
                    </tr>
                  ))
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
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
                            {p.stockUnits} base units
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
                              Add stock
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
                        {ACTION_LABELS[m.actionType]}
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
