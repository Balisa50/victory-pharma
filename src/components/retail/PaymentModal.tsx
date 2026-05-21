"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { submitPaymentSchema, type SubmitPaymentInput } from "@/lib/validation/payment";
import { formatCurrency, PAYMENT_METHOD_LABELS } from "@/lib/utils";
import type { OrderWithRelations } from "@/types";
import { PaymentMethod } from "@prisma/client";

type Props = {
  order: OrderWithRelations;
  onClose: () => void;
  onSubmitted: () => void;
};

export function PaymentModal({ order, onClose, onSubmitted }: Props) {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<SubmitPaymentInput>({
    resolver: zodResolver(submitPaymentSchema),
    defaultValues: {
      orderId: order.id,
      amount: Number(order.totalAmount),
      method: PaymentMethod.cash,
    },
  });

  async function onSubmit(data: SubmitPaymentInput) {
    setLoading(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (json.success) {
        toast.success("Payment submitted. Awaiting confirmation");
        onSubmitted();
      } else {
        toast.error(json.error ?? "Failed to submit payment");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Submit Payment</h2>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("orderId")} />

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Amount (GMD)
            </label>
            <input
              {...register("amount", { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0.01"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-400">Order total: {formatCurrency(Number(order.totalAmount))}</p>
            {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Payment Method</label>
            <select
              {...register("method")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {Object.entries(PAYMENT_METHOD_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            {errors.method && <p className="mt-1 text-xs text-red-600">{errors.method.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes (optional)</label>
            <textarea
              {...register("notes")}
              rows={3}
              placeholder="Reference number, transaction ID..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
