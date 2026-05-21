"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { formatDateTime, COMPLAINT_TYPE_LABELS } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader, PageBody, Panel } from "@/components/shared/Editorial";
import type { Complaint, ComplaintStatus } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((d) => d.data);

type ComplaintRow = Complaint & {
  retailPharmacy: { name: string; pharmacyName: string | null };
  order: { id: string; createdAt: Date };
};

const STATUS_COLORS: Record<ComplaintStatus, string> = {
  pending: "bg-[hsl(var(--gold))]/15 text-[hsl(var(--gold))]",
  in_review: "bg-[hsl(var(--navy-3))]/12 text-[hsl(var(--navy-3))]",
  resolved: "bg-[hsl(var(--green))]/12 text-[hsl(var(--green))]",
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
    <>
      <PageHeader
        eyebrow="Issue tracker"
        title="Partner"
        accent="complaints"
        description="Review and resolve issues raised by retail partners on their orders."
      />

      <PageBody>
        {/* Filter */}
        <div className="flex flex-wrap gap-2">
          {(["", "pending", "in_review", "resolved"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.1em] transition-colors ${
                statusFilter === s
                  ? "bg-[hsl(var(--navy))] text-white"
                  : "border border-neutral-200 bg-white text-neutral-500 hover:bg-[hsl(var(--offwhite))]"
              }`}
            >
              {s === "" ? "All" : s.replace("_", " ")}
            </button>
          ))}
        </div>

        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="ed-thead">
                  <th className="px-6 py-3.5 md:px-7">Pharmacy</th>
                  <th className="px-4 py-3.5">Order</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Description</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-6 py-3.5 text-right md:px-7">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-neutral-100">
                      <td colSpan={7} className="h-14 animate-pulse bg-neutral-50/60" />
                    </tr>
                  ))
                ) : (data?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState message="No complaints to show. A quiet queue is a good queue." />
                    </td>
                  </tr>
                ) : (
                  data!.map((c) => (
                    <tr key={c.id} className="ed-row align-top">
                      <td className="px-6 py-4 md:px-7">
                        <span className="serif italic text-[hsl(var(--navy))]">
                          {c.retailPharmacy.pharmacyName ?? c.retailPharmacy.name}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-mono text-[11.5px] tracking-wide text-neutral-400">
                        #{c.orderId.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {COMPLAINT_TYPE_LABELS[c.type]}
                      </td>
                      <td className="max-w-xs px-4 py-4">
                        <p className="truncate text-neutral-600">{c.description}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_COLORS[c.status]}`}
                        >
                          {c.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-[12px] text-neutral-400">
                        {formatDateTime(c.createdAt)}
                      </td>
                      <td className="px-6 py-4 md:px-7">
                        <div className="flex justify-end gap-1.5">
                          {c.status === "pending" && (
                            <button
                              onClick={() => updateStatus(c.id, "in_review")}
                              disabled={updatingId === c.id}
                              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11.5px] font-semibold text-[hsl(var(--navy-3))] transition-colors hover:bg-[hsl(var(--navy-3))]/10 disabled:opacity-50"
                            >
                              {updatingId === c.id && (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              )}
                              Review
                            </button>
                          )}
                          {c.status !== "resolved" && (
                            <button
                              onClick={() => updateStatus(c.id, "resolved")}
                              disabled={updatingId === c.id}
                              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11.5px] font-semibold text-[hsl(var(--green))] transition-colors hover:bg-[hsl(var(--green))]/10 disabled:opacity-50"
                            >
                              {updatingId === c.id && (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              )}
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
        </Panel>
      </PageBody>
    </>
  );
}
