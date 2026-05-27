"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, X, Truck } from "lucide-react";

export function DeliveryFeeModal({
  orderId,
  initialFee,
  initialAddress,
  onClose,
  onDone,
}: {
  orderId: string;
  initialFee: number;
  initialAddress: string | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [fee, setFee] = useState<string>(String(initialFee));
  const [address, setAddress] = useState<string>(initialAddress ?? "");
  const [loading, setLoading] = useState(false);

  async function submit() {
    const parsed = Number(fee);
    if (Number.isNaN(parsed) || parsed < 0) {
      toast.error("Delivery fee must be a non-negative number");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/delivery`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryFee: parsed, deliveryAddress: address || null }),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (json.success) {
        toast.success("Delivery fee updated");
        onDone();
      } else {
        toast.error(json.error ?? "Failed to update delivery fee");
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
            <Truck className="h-4 w-4 text-[hsl(var(--red-2))]" />
            <p className="serif text-[16px] text-[hsl(var(--navy))]">
              Delivery fee
            </p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="eyebrow mb-1 block text-[hsl(var(--red-2))]">
              Fee
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              className="field w-full"
            />
            <p className="mt-1 text-[11.5px] text-neutral-500">
              The order total updates immediately. Set 0 to remove the fee.
            </p>
          </div>
          <div>
            <label className="eyebrow mb-1 block text-[hsl(var(--red-2))]">
              Delivery address (optional)
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              maxLength={300}
              className="field w-full"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-neutral-100 px-6 py-3">
          <button onClick={onClose} className="btn btn-ghost" disabled={loading}>
            Cancel
          </button>
          <button onClick={submit} className="btn btn-navy" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
