"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/shared/Editorial";
import type { Product } from "@/types";

export function AdjustStockModal({
  product,
  onClose,
  onDone,
}: {
  product: Product;
  onClose: () => void;
  onDone: () => void;
}) {
  const [direction, setDirection] = useState<"add" | "remove">("remove");
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const adjustment = direction === "add" ? amount : -amount;
  const projected = product.stockUnits + adjustment;

  async function confirm() {
    if (amount <= 0) {
      toast.error("Enter an amount");
      return;
    }
    if (reason.trim().length < 3) {
      toast.error("A reason is required");
      return;
    }
    if (projected < 0) {
      toast.error("Adjustment would drive stock below zero");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/warehouse/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "adjust",
          productId: product.id,
          adjustment,
          reason: reason.trim(),
        }),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (json.success) {
        toast.success("Stock adjusted");
        onDone();
      } else {
        toast.error(json.error ?? "Failed to adjust stock");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal eyebrow="Warehouse" title="Manual" accent="adjustment" onClose={onClose}>
      <div className="space-y-4 px-6 py-6">
        <p className="text-[13px] font-light leading-relaxed text-neutral-600">
          Correcting stock for{" "}
          <span className="font-medium text-[hsl(var(--navy))]">
            {product.name}
          </span>{" "}
          (currently {product.stockUnits} units). Use for damage, expiry, or
          count corrections.
        </p>

        <div className="flex gap-1 rounded-lg bg-[hsl(var(--offwhite))] p-1">
          {(["remove", "add"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDirection(d)}
              className={`flex-1 rounded-md py-1.5 text-[12px] font-semibold uppercase tracking-[0.1em] transition-colors ${
                direction === d
                  ? "bg-[hsl(var(--navy))] text-white"
                  : "text-neutral-500"
              }`}
            >
              {d === "remove" ? "Remove" : "Add"}
            </button>
          ))}
        </div>

        <div>
          <label className="field-label">Amount (base units)</label>
          <input
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
            className="field"
          />
          <p className="mt-1 text-[11.5px] text-neutral-400">
            Stock after adjustment: {projected} units
          </p>
        </div>

        <div>
          <label className="field-label">Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            className="field"
            placeholder="Expired stock, breakage, recount..."
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
            className="btn btn-red"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Apply adjustment
          </button>
        </div>
      </div>
    </Modal>
  );
}
