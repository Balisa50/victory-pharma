"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/shared/Editorial";
import { unitsForPack, formatStockBreakdown } from "@/lib/packaging";
import type { Product } from "@/types";

export function AddStockModal({
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

  const addedUnits =
    cartons * unitsForPack(product, "carton") +
    bottles * unitsForPack(product, "bottle") +
    units;

  async function confirm() {
    if (addedUnits <= 0) {
      toast.error("Enter at least one carton, bottle, or unit");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/warehouse/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          productId: product.id,
          cartons,
          bottles,
          units,
          note: note || undefined,
        }),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (json.success) {
        toast.success(`Added ${addedUnits} units to ${product.name}`);
        onDone();
      } else {
        toast.error(json.error ?? "Failed to add stock");
      }
    } finally {
      setLoading(false);
    }
  }

  const numField =
    "field bg-white text-center";

  return (
    <Modal eyebrow="Warehouse" title="Add" accent="stock" onClose={onClose}>
      <div className="space-y-4 px-6 py-6">
        <p className="text-[13px] font-light leading-relaxed text-neutral-600">
          Restocking{" "}
          <span className="font-medium text-[hsl(var(--navy))]">
            {product.name}
          </span>
          . 1 carton = {product.bottlesPerCarton} bottles, 1 bottle ={" "}
          {product.unitsPerBottle} units.
        </p>

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

        <div className="rounded-lg bg-[hsl(var(--offwhite))] px-4 py-3 text-[12.5px]">
          <p className="text-neutral-500">
            Adds{" "}
            <span className="font-semibold text-[hsl(var(--navy))]">
              {addedUnits} base units
            </span>
          </p>
          <p className="mt-0.5 text-neutral-400">
            New total:{" "}
            {formatStockBreakdown({
              ...product,
              stockUnits: product.stockUnits + addedUnits,
            })}
          </p>
        </div>

        <div>
          <label className="field-label">Note (optional)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="field"
            placeholder="Supplier, invoice reference..."
          />
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={loading}
            className="btn btn-navy"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Add to warehouse
          </button>
        </div>
      </div>
    </Modal>
  );
}
