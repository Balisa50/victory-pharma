"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Check, X, RotateCcw, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { PageHeader, PageBody, Panel } from "@/components/shared/Editorial";
import { EmptyState } from "@/components/shared/EmptyState";
import { ApproveModal, type PharmacyApplication } from "./components/ApproveModal";
import { RejectModal } from "./components/RejectModal";

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((d) => d.data as PharmacyApplication[]);

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "active", label: "Approved" },
  { key: "rejected", label: "Rejected" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function VerificationPage() {
  const [tab, setTab] = useState<TabKey>("pending");
  const { data, isLoading, mutate } = useSWR(
    `/api/admin/verify-pharmacy?status=${tab}`,
    fetcher,
    { refreshInterval: 20000 }
  );

  const [approving, setApproving] = useState<PharmacyApplication | null>(null);
  const [rejecting, setRejecting] = useState<PharmacyApplication | null>(null);
  const [reopeningId, setReopeningId] = useState<string | null>(null);

  async function reopen(id: string) {
    setReopeningId(id);
    try {
      const res = await fetch("/api/admin/verify-pharmacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id, action: "reopen" }),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (json.success) {
        toast.success("Application moved back to pending");
        mutate();
      } else {
        toast.error(json.error ?? "Failed to reopen");
      }
    } finally {
      setReopeningId(null);
    }
  }

  const rows = data ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Compliance"
        title="Pharmacy"
        accent="verification"
        description="Review, approve, and track every retail pharmacy before they gain access."
      />

      <PageBody>
        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.1em] transition-colors ${
                tab === t.key
                  ? "bg-[hsl(var(--navy))] text-white"
                  : "border border-neutral-200 bg-white text-neutral-500 hover:bg-[hsl(var(--offwhite))]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="ed-thead">
                  <th className="px-6 py-3.5 md:px-7">Pharmacy</th>
                  {tab === "active" && <th className="px-4 py-3.5">Pharmacy ID</th>}
                  <th className="px-4 py-3.5">Owner</th>
                  {tab !== "rejected" && <th className="px-4 py-3.5">Contact</th>}
                  {tab === "pending" && <th className="px-4 py-3.5">Location</th>}
                  {tab === "pending" && <th className="px-4 py-3.5">Reg / License</th>}
                  {tab === "rejected" && <th className="px-4 py-3.5">Reason</th>}
                  <th className="px-4 py-3.5">
                    {tab === "active" ? "Verified" : "Registered"}
                  </th>
                  <th className="px-6 py-3.5 text-right md:px-7">
                    {tab === "active" ? "" : "Action"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-neutral-100">
                      <td colSpan={8} className="h-14 animate-pulse bg-neutral-50/60" />
                    </tr>
                  ))
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState
                        message={
                          tab === "pending"
                            ? "No applications awaiting review."
                            : tab === "active"
                            ? "No approved pharmacies yet."
                            : "No rejected applications."
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className="ed-row align-top">
                      <td className="px-6 py-4 md:px-7">
                        <span className="serif italic text-[hsl(var(--navy))]">
                          {r.pharmacyName ?? "Unnamed pharmacy"}
                        </span>
                      </td>

                      {tab === "active" && (
                        <td className="px-4 py-4 font-mono text-[12px] font-medium text-[hsl(var(--navy))]">
                          {r.pharmacyId ?? "—"}
                        </td>
                      )}

                      <td className="px-4 py-4 text-neutral-600">{r.name}</td>

                      {tab !== "rejected" && (
                        <td className="px-4 py-4 text-[12.5px] text-neutral-500">
                          <p>{r.phone}</p>
                          <p className="text-neutral-400">{r.email}</p>
                        </td>
                      )}

                      {tab === "pending" && (
                        <td className="max-w-[14rem] px-4 py-4 text-[12.5px] text-neutral-500">
                          {r.location ?? (
                            <span className="text-neutral-300">Not provided</span>
                          )}
                        </td>
                      )}

                      {tab === "pending" && (
                        <td className="px-4 py-4 text-[12px] text-neutral-500">
                          <p>{r.businessRegNumber || "Reg: —"}</p>
                          <p className="text-neutral-400">
                            {r.licenseNumber || "Lic: —"}
                          </p>
                        </td>
                      )}

                      {tab === "rejected" && (
                        <td className="max-w-[18rem] px-4 py-4 text-[12.5px] text-neutral-600">
                          {r.rejectionReason ?? "—"}
                        </td>
                      )}

                      <td className="px-4 py-4 text-[12px] text-neutral-400">
                        {formatDate(
                          tab === "active" && r.verifiedAt
                            ? r.verifiedAt
                            : r.createdAt
                        )}
                      </td>

                      <td className="px-6 py-4 md:px-7">
                        <div className="flex justify-end gap-1.5">
                          {tab === "pending" && (
                            <>
                              <button
                                onClick={() => setApproving(r)}
                                className="inline-flex items-center gap-1 rounded-md bg-[hsl(var(--navy))] px-2.5 py-1.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-[hsl(var(--navy-2))]"
                              >
                                <Check className="h-3.5 w-3.5" />
                                Approve
                              </button>
                              <button
                                onClick={() => setRejecting(r)}
                                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11.5px] font-semibold text-[hsl(var(--red))] transition-colors hover:bg-[hsl(var(--red))]/10"
                              >
                                <X className="h-3.5 w-3.5" />
                                Reject
                              </button>
                            </>
                          )}
                          {tab === "rejected" && (
                            <button
                              onClick={() => reopen(r.id)}
                              disabled={reopeningId === r.id}
                              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11.5px] font-semibold text-[hsl(var(--navy))] transition-colors hover:bg-[hsl(var(--navy))]/8 disabled:opacity-50"
                            >
                              {reopeningId === r.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RotateCcw className="h-3.5 w-3.5" />
                              )}
                              Re-open
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

      {approving && (
        <ApproveModal
          application={approving}
          onClose={() => setApproving(null)}
          onDone={() => {
            setApproving(null);
            mutate();
          }}
        />
      )}
      {rejecting && (
        <RejectModal
          application={rejecting}
          onClose={() => setRejecting(null)}
          onDone={() => {
            setRejecting(null);
            mutate();
          }}
        />
      )}
    </>
  );
}
