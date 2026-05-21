"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/shared/Editorial";

export type PharmacyApplication = {
  id: string;
  name: string;
  email: string;
  phone: string;
  pharmacyName: string | null;
  pharmacyId: string | null;
  location: string | null;
  businessRegNumber: string | null;
  licenseNumber: string | null;
  status: string;
  rejectionReason: string | null;
  verifiedAt: string | null;
  createdAt: string;
};

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="eyebrow mb-0.5 text-[hsl(var(--red-2))]">{label}</p>
      <p className="text-[13px] text-[hsl(var(--navy))]">
        {value || <span className="text-neutral-300">Not provided</span>}
      </p>
    </div>
  );
}

export function ApproveModal({
  application,
  onClose,
  onDone,
}: {
  application: PharmacyApplication;
  onClose: () => void;
  onDone: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");

  async function confirm() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/verify-pharmacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: application.id,
          action: "approve",
          notes: notes || undefined,
        }),
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: { pharmacyId: string | null };
        error?: string;
      };
      if (json.success) {
        toast.success(
          `Approved. Pharmacy ID ${json.data?.pharmacyId ?? ""} assigned.`
        );
        onDone();
      } else {
        toast.error(json.error ?? "Failed to approve");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      eyebrow="Verification"
      title="Approve"
      accent="pharmacy"
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <div className="space-y-5 px-6 py-6">
        <div className="grid grid-cols-2 gap-x-5 gap-y-4 rounded-lg bg-[hsl(var(--offwhite))] p-4">
          <Detail label="Pharmacy" value={application.pharmacyName} />
          <Detail label="Owner" value={application.name} />
          <Detail label="Phone" value={application.phone} />
          <Detail label="Email" value={application.email} />
          <div className="col-span-2">
            <Detail label="Location" value={application.location} />
          </div>
          <Detail label="Business reg." value={application.businessRegNumber} />
          <Detail label="License no." value={application.licenseNumber} />
        </div>

        <div className="rounded-lg border border-[hsl(var(--green))]/25 bg-[hsl(var(--green))]/8 px-4 py-3 text-[12.5px] text-neutral-600">
          On approval a unique pharmacy ID is generated and the account can sign
          in immediately.
        </div>

        <div>
          <label className="field-label">Internal notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="field"
            placeholder="Anything worth recording about this approval"
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
            Confirm approval
          </button>
        </div>
      </div>
    </Modal>
  );
}
