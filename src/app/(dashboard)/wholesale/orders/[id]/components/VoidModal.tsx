"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, X, AlertTriangle } from "lucide-react";

export function VoidModal({
  orderId,
  onClose,
  onDone,
}: {
  orderId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!reason.trim()) {
      toast.error("A reason is required to void an order");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled", voidReason: reason.trim() }),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (json.success) {
        toast.success("Order voided · stock returned to sales inventory");
        onDone();
      } else {
        toast.error(json.error ?? "Failed to void order");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[hsl(var(--navy))]/40 px-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-[hsl(var(--navy))]/10">
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-[hsl(var(--red-2))]" />
            <p className="serif text-[16px] text-[hsl(var(--navy))]">
              Void order
            </p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <p className="text-[13px] leading-relaxed text-neutral-500">
            Voiding returns every line item back into sales inventory and
            permanently locks the order. This action is logged and cannot be
            undone.
          </p>
          <div>
            <label className="eyebrow mb-1 block text-[hsl(var(--red-2))]">
              Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Wrong sale, customer cancellation, pricing mistake…"
              className="field w-full"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-neutral-100 px-6 py-3">
          <button onClick={onClose} className="btn btn-ghost" disabled={loading}>
            Cancel
          </button>
          <button onClick={submit} className="btn btn-red" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Void & return stock
          </button>
        </div>
      </div>
    </div>
  );
}
