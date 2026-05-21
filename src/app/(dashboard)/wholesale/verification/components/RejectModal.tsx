"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/shared/Editorial";
import type { PharmacyApplication } from "./ApproveModal";

const PRESET_REASONS = [
  "Not a verified pharmacy",
  "Invalid or missing license",
  "Incomplete information",
  "Other",
];

export function RejectModal({
  application,
  onClose,
  onDone,
}: {
  application: PharmacyApplication;
  onClose: () => void;
  onDone: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [preset, setPreset] = useState(PRESET_REASONS[0]);
  const [detail, setDetail] = useState("");

  async function confirm() {
    const reason =
      preset === "Other"
        ? detail.trim()
        : detail.trim()
        ? `${preset} — ${detail.trim()}`
        : preset;

    if (reason.length < 3) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/verify-pharmacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: application.id,
          action: "reject",
          reason,
        }),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (json.success) {
        toast.success("Application rejected");
        onDone();
      } else {
        toast.error(json.error ?? "Failed to reject");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      eyebrow="Verification"
      title="Reject"
      accent="application"
      onClose={onClose}
    >
      <div className="space-y-4 px-6 py-6">
        <p className="text-[13px] font-light leading-relaxed text-neutral-600">
          Rejecting{" "}
          <span className="font-medium text-[hsl(var(--navy))]">
            {application.pharmacyName ?? application.name}
          </span>
          . The pharmacy will see this reason when they sign in.
        </p>

        <div>
          <label className="field-label">Reason</label>
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
            className="field"
          >
            {PRESET_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label">
            {preset === "Other" ? "Details" : "Additional details (optional)"}
          </label>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={3}
            className="field"
            placeholder="Explain what the pharmacy needs to correct"
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
            Confirm rejection
          </button>
        </div>
      </div>
    </Modal>
  );
}
