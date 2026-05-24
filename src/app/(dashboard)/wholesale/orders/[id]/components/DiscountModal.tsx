"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/shared/Editorial";
import { formatCurrency } from "@/lib/utils";

export function DiscountModal({
  orderId,
  subtotal,
  initialType,
  initialValue,
  onClose,
  onDone,
}: {
  orderId: string;
  subtotal: number;
  initialType?: string | null;
  initialValue?: number | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [type, setType] = useState<"percentage" | "fixed">(
    initialType === "fixed" ? "fixed" : "percentage"
  );
  const [value, setValue] = useState<number>(initialValue ?? 0);
  const [loading, setLoading] = useState(false);

  const computed =
    type === "percentage"
      ? Math.min(subtotal, (subtotal * Math.max(0, value)) / 100)
      : Math.min(subtotal, Math.max(0, value));
  const final = Math.max(0, subtotal - computed);

  async function apply() {
    if (value <= 0) {
      toast.error("Enter a discount value");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/discount`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, value }),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (json.success) {
        toast.success("Discount applied");
        onDone();
      } else {
        toast.error(json.error ?? "Failed to apply discount");
      }
    } finally {
      setLoading(false);
    }
  }

  async function clear() {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/discount`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (json.success) {
        toast.success("Discount cleared");
        onDone();
      } else {
        toast.error(json.error ?? "Failed to clear discount");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal eyebrow="Order" title="Apply" accent="discount" onClose={onClose}>
      <div className="space-y-4 px-6 py-6">
        <div className="flex gap-1 rounded-lg bg-[hsl(var(--offwhite))] p-1">
          {(["percentage", "fixed"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 rounded-md py-1.5 text-[12px] font-semibold uppercase tracking-[0.1em] transition-colors ${
                type === t
                  ? "bg-[hsl(var(--navy))] text-white"
                  : "text-neutral-500"
              }`}
            >
              {t === "percentage" ? "%" : "Fixed amount"}
            </button>
          ))}
        </div>

        <div>
          <label className="field-label">
            {type === "percentage" ? "Discount percent" : "Discount amount (GMD)"}
          </label>
          <input
            type="number"
            min="0"
            step={type === "percentage" ? "1" : "0.01"}
            value={value}
            onChange={(e) => setValue(Math.max(0, Number(e.target.value)))}
            className="field"
          />
        </div>

        <div className="space-y-1.5 rounded-lg bg-[hsl(var(--offwhite))] px-4 py-3 text-[13px]">
          <div className="flex justify-between text-neutral-500">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-[hsl(var(--red-2))]">
            <span>Discount</span>
            <span>-{formatCurrency(computed)}</span>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-1.5 font-semibold text-[hsl(var(--navy))]">
            <span>Final total</span>
            <span>{formatCurrency(final)}</span>
          </div>
        </div>

        <div className="flex justify-between gap-3">
          {initialType ? (
            <button
              type="button"
              onClick={clear}
              disabled={loading}
              className="btn btn-ghost"
            >
              Clear discount
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancel
            </button>
            <button
              type="button"
              onClick={apply}
              disabled={loading}
              className="btn btn-red"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Apply discount
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
