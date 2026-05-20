"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { createComplaintSchema, type CreateComplaintInput } from "@/lib/validation/complaint";
import { COMPLAINT_TYPE_LABELS } from "@/lib/utils";
import { ComplaintType } from "@prisma/client";

type Props = {
  orderId: string;
  onClose: () => void;
  onSubmitted: () => void;
};

export function ComplaintModal({ orderId, onClose, onSubmitted }: Props) {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<CreateComplaintInput>({
    resolver: zodResolver(createComplaintSchema),
    defaultValues: { orderId, type: ComplaintType.other },
  });

  async function onSubmit(data: CreateComplaintInput) {
    setLoading(true);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (json.success) {
        toast.success("Complaint submitted");
        onSubmitted();
      } else {
        toast.error(json.error ?? "Failed to submit complaint");
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
          <h2 className="text-lg font-semibold text-gray-900">Submit Complaint</h2>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("orderId")} />

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Issue type</label>
            <select
              {...register("type")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {Object.entries(COMPLAINT_TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            {errors.type && <p className="mt-1 text-xs text-red-600">{errors.type.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              {...register("description")}
              rows={4}
              placeholder="Describe the issue in detail..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
