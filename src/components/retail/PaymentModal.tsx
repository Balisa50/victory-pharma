"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  submitPaymentSchema,
  type SubmitPaymentInput,
} from "@/lib/validation/payment";
import { formatCurrency, PAYMENT_METHOD_LABELS } from "@/lib/utils";
import { Modal } from "@/components/shared/Editorial";
import type { OrderWithRelations } from "@/types";
import { PaymentMethod } from "@prisma/client";

type Props = {
  order: OrderWithRelations;
  onClose: () => void;
  onSubmitted: () => void;
};

export function PaymentModal({ order, onClose, onSubmitted }: Props) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SubmitPaymentInput>({
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
    <Modal eyebrow="Settlement" title="Submit a" accent="payment" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-6">
        <input type="hidden" {...register("orderId")} />

        <div>
          <label className="field-label">Amount (GMD)</label>
          <input
            {...register("amount", { valueAsNumber: true })}
            type="number"
            step="0.01"
            min="0.01"
            className="field"
          />
          <p className="mt-1 text-[11.5px] text-neutral-400">
            Order total: {formatCurrency(Number(order.totalAmount))}
          </p>
          {errors.amount && (
            <p className="field-error">{errors.amount.message}</p>
          )}
        </div>

        <div>
          <label className="field-label">Payment method</label>
          <select {...register("method")} className="field">
            {Object.entries(PAYMENT_METHOD_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
          {errors.method && (
            <p className="field-error">{errors.method.message}</p>
          )}
        </div>

        <div>
          <label className="field-label">Notes (optional)</label>
          <textarea
            {...register("notes")}
            rows={3}
            placeholder="Reference number, transaction ID..."
            className="field"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn btn-red">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit payment
          </button>
        </div>
      </form>
    </Modal>
  );
}
