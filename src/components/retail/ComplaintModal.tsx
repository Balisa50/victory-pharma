"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  createComplaintSchema,
  type CreateComplaintInput,
} from "@/lib/validation/complaint";
import { COMPLAINT_TYPE_LABELS } from "@/lib/utils";
import { Modal } from "@/components/shared/Editorial";
import { ComplaintType } from "@prisma/client";

type Props = {
  orderId: string;
  onClose: () => void;
  onSubmitted: () => void;
};

export function ComplaintModal({ orderId, onClose, onSubmitted }: Props) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateComplaintInput>({
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
    <Modal eyebrow="Support" title="Report an" accent="issue" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-6">
        <input type="hidden" {...register("orderId")} />

        <div>
          <label className="field-label">Issue type</label>
          <select {...register("type")} className="field">
            {Object.entries(COMPLAINT_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
          {errors.type && <p className="field-error">{errors.type.message}</p>}
        </div>

        <div>
          <label className="field-label">Description</label>
          <textarea
            {...register("description")}
            rows={4}
            placeholder="Describe the issue in detail..."
            className="field"
          />
          {errors.description && (
            <p className="field-error">{errors.description.message}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn btn-red">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit
          </button>
        </div>
      </form>
    </Modal>
  );
}
