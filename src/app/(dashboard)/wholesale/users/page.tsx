"use client";

import { useState } from "react";
import useSWR from "swr";
import { Search, UserPlus } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { PageHeader, PageBody, Panel } from "@/components/shared/Editorial";
import { EmptyState } from "@/components/shared/EmptyState";
import { AddManagerModal } from "@/components/wholesale/AddManagerModal";

type UserRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "wholesale_admin" | "manager" | "retail_pharmacy";
  status: "pending" | "active" | "rejected";
  pharmacyName: string | null;
  pharmacyId: string | null;
  location: string | null;
  verifiedAt: string | null;
  createdAt: string;
};

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((d) => d.data as UserRow[]);

const ROLE_FILTERS = [
  { key: "", label: "All" },
  { key: "retail_pharmacy", label: "Pharmacies" },
  { key: "manager", label: "Managers" },
  { key: "wholesale_admin", label: "Admins" },
] as const;

const STATUS_STYLES: Record<UserRow["status"], string> = {
  pending: "bg-[hsl(var(--gold))]/15 text-[hsl(var(--gold))]",
  active: "bg-[hsl(var(--green))]/12 text-[hsl(var(--green))]",
  rejected: "bg-[hsl(var(--red))]/12 text-[hsl(var(--red))]",
};

const ROLE_LABEL: Record<UserRow["role"], string> = {
  wholesale_admin: "Admin",
  manager: "Manager",
  retail_pharmacy: "Pharmacy",
};

export default function UsersPage() {
  const [role, setRole] = useState<"" | UserRow["role"]>("");
  const [search, setSearch] = useState("");
  const [managerOpen, setManagerOpen] = useState(false);

  const params = new URLSearchParams({
    ...(role ? { role } : {}),
    ...(search.length >= 2 ? { search } : {}),
  });
  const { data, isLoading, mutate } = useSWR(
    `/api/admin/users?${params}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const rows = data ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Accounts"
        title="System"
        accent="users"
        description="Every account on the platform, filterable by role and status."
        action={
          <button onClick={() => setManagerOpen(true)} className="btn btn-navy">
            <UserPlus className="h-4 w-4" />
            Add manager
          </button>
        }
      />

      <PageBody>
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            {ROLE_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setRole(f.key)}
                className={`rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.1em] transition-colors ${
                  role === f.key
                    ? "bg-[hsl(var(--navy))] text-white"
                    : "border border-neutral-200 bg-white text-neutral-500 hover:bg-[hsl(var(--offwhite))]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[14rem] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, pharmacy, ID..."
              className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3 text-[13px] transition-colors focus:border-[hsl(var(--gold))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--gold))]/20"
            />
          </div>
        </div>

        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="ed-thead">
                  <th className="px-6 py-3.5 md:px-7">Name</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Pharmacy</th>
                  <th className="px-4 py-3.5">Contact</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right md:px-7">Joined</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-neutral-100">
                      <td colSpan={6} className="h-14 animate-pulse bg-neutral-50/60" />
                    </tr>
                  ))
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState message="No users match this filter." />
                    </td>
                  </tr>
                ) : (
                  rows.map((u) => (
                    <tr key={u.id} className="ed-row align-top">
                      <td className="px-6 py-4 md:px-7">
                        <p className="serif italic text-[hsl(var(--navy))]">
                          {u.name}
                        </p>
                        {u.pharmacyId && (
                          <p className="mt-0.5 font-mono text-[11px] tracking-wide text-neutral-400">
                            {u.pharmacyId}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                        {ROLE_LABEL[u.role]}
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {u.pharmacyName ?? (
                          <span className="text-neutral-300">—</span>
                        )}
                        {u.location && (
                          <p className="mt-0.5 text-[11.5px] text-neutral-400">
                            {u.location}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-[12.5px] text-neutral-500">
                        <p>{u.phone}</p>
                        <p className="text-neutral-400">{u.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLES[u.status]}`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-[12px] text-neutral-400 md:px-7">
                        {formatDate(u.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </PageBody>

      {managerOpen && (
        <AddManagerModal
          onClose={() => setManagerOpen(false)}
          onDone={() => {
            setManagerOpen(false);
            mutate();
          }}
        />
      )}
    </>
  );
}
