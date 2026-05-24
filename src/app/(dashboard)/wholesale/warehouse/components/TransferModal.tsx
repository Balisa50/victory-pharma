"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";
import { Modal } from "@/components/shared/Editorial";
import { unitsForPack, formatStockBreakdown } from "@/lib/packaging";
import type { Product } from "@/types";

export function TransferModal({
  product,
  onClose,
  onDone,
}: {
  product: Product;
  onClose: () => void;
  onDone: () => void;
}) {
  const [cartons, setCartons] = useState(0);
  const [bottles, setBottles] = useState(0);
  const [units, setUnits] = useState(0);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const transferred =
    cartons * unitsForPack(product, "carton") +
    bottles * unitsForPack(product, "bottle") +
    units;

  const tooMuch = transferred > product.warehouseUnits;

  async function confirm() {
    if (transferred <= 0) {
      toast.error("Enter at least one carton, bottle, or unit");
      return;
    }
    if (tooMuch) {
      toast.error("Not enough warehouse stock for this transfer");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/warehouse/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "transfer",
          productId: product.id,
          cartons,
          bottles,
          units,
          note: note || undefined,
        }),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (json.success) {
        toast.success(`Transferred ${transferred} units to sales inventory`);
        onDone();
      } else {
        toast.error(json.error ?? "Transfer failed");
      }
    } finally {
      setLoading(false);
    }
  }

  const numField = "field bg-white text-center";

  return (
    <Modal eyebrow="Warehouse" title="Transfer to" accent="sales" onClose={onClose}>
      <div className="space-y-4 px-6 py-6">
        <p className="text-[13px] font-light leading-relaxed text-neutral-600">
          Moving stock for{" "}
          <span className="font-medium text-[hsl(var(--navy))]">
            {product.name}
          </span>
          . Sales inventory only grows through this transfer.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-[hsl(var(--offwhite))] px-4 py-3 text-[12.5px]">
            <p className="eyebrow mb-1 text-[hsl(var(--red-2))]">Warehouse</p>
            <p className="serif text-[16px] text-[hsl(var(--navy))]">
              {product.warehouseUnits} units
            </p>
            <p className="text-neutral-400">{formatStockBreakdown({ ...product, stockUnits: product.warehouseUnits })}</p>
          </div>
          <div className="rounded-lg bg-[hsl(var(--green))]/8 px-4 py-3 text-[12.5px]">
            <p className="eyebrow mb-1 text-[hsl(var(--green))]">Sales</p>
            <p className="serif text-[16px] text-[hsl(var(--navy))]">
              {product.stockUnits} units
            </p>
            <p className="text-neutral-400">{formatStockBreakdown(product)}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="field-label">Cartons</label>
            <input
              type="number"
              min="0"
              value={cartons}
              onChange={(e) => setCartons(Math.max(0, Number(e.target.value)))}
              className={numField}
            />
          </div>
          <div>
            <label className="field-label">Bottles</label>
            <input
              type="number"
              min="0"
              value={bottles}
              onChange={(e) => setBottles(Math.max(0, Number(e.target.value)))}
              className={numField}
            />
          </div>
          <div>
            <label className="field-label">Units</label>
            <input
              type="number"
              min="0"
              value={units}
              onChange={(e) => setUnits(Math.max(0, Number(e.target.value)))}
              className={numField}
            />
          </div>
        </div>

        <div
          className={`flex items-center justify-between rounded-lg px-4 py-3 text-[12.5px] ${
            tooMuch
              ? "bg-[hsl(var(--red))]/8 text-[hsl(var(--red))]"
              : "bg-[hsl(var(--offwhite))] text-neutral-600"
          }`}
        >
          <span>
            Move{" "}
            <span className="font-semibold text-[hsl(var(--navy))]">
              {transferred} units
            </span>
          </span>
          <ArrowRight className="h-4 w-4 text-neutral-400" />
          <span>
            New sales:{" "}
            <span className="font-semibold text-[hsl(var(--navy))]">
              {product.stockUnits + transferred}
            </span>
          </span>
        </div>

        <div>
          <label className="field-label">Note (optional)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="field"
            placeholder="Reason or reference"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={loading || tooMuch}
            className="btn btn-red"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm transfer
          </button>
        </div>
      </div>
    </Modal>
  );
}
