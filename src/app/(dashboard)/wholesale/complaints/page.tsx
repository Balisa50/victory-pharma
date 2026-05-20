"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { formatDateTime, COMPLAINT_TYPE_LABELS } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableRowSkeleton } from "@/components/shared/LoadingSkeleton";
import type { Complaint, ComplaintStatus } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((d) => d.data);

type ComplaintRow = Complaint & {
  retailPharmacy: { name: string; pharmacyName: string | null };
  order: { id: string; createdAt: Date };
};

const STATUS_COLORS: Record<ComplaintStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  in_review: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
};

export default function WholesaleComplaintsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data, isLoading, mutate } = useSWR<ComplaintRow[]>(
    `/api/complaints${statusFilter ? `?status=${statusFilter}` : ""}`,
    fetcher,
    { refreshInterval: 15000 }
  );

  async function updateStatus(id: string, status: ComplaintStatus) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/complaints/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (json.success) {
        toast.success("Complaint status updated");
        await mutate();
      } else {
        toast.error(json.error ?? "Failed to update");
      }
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Complaints</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {(["", "pending", "in_review", "resolved"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              statusFilter === s
                ? "bg-emerald-600 text-white"
                : "border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s === "" ? "All" : s.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase text-gray-400">
                <th className="px-4 py-3">Pharmacy</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)
              ) : (data?.length ?? 0) === 0 ? (
                <tr><td colSpan={7}><EmptyState message="No complaints found" /></td></tr>
              ) : (
                data!.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {c.retailPharmacy.pharmacyName ?? c.retailPharmacy.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">#{c.orderId.slice(-8)}</td>
                    <td className="px-4 py-3 text-gray-600">{COMPLAINT_TYPE_LABELS[c.type]}</td>
                    <td className="max-w-xs px-4 py-3">
                      <p className="truncate text-gray-600">{c.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status]}`}>
                        {c.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(c.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {c.status === "pending" && (
                          <button
                            onClick={() => updateStatus(c.id, "in_review")}
                            disabled={updatingId === c.id}
                            className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                          >
                            {updatingId === c.id && <Loader2 className="h-3 w-3 animate-spin" />}
                            Review
                          </button>
                        )}
                        {c.status !== "resolved" && (
                          <button
                            onClick={() => updateStatus(c.id, "resolved")}
                            disabled={updatingId === c.id}
                            className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50 disabled:opacity-50"
                          >
                            {updatingId === c.id && <Loader2 className="h-3 w-3 animate-spin" />}
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
