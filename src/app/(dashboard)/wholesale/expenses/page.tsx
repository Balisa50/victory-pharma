"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Trash2, Pencil } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader, PageBody, Panel, StatTile, Modal } from "@/components/shared/Editorial";
import { EmptyState } from "@/components/shared/EmptyState";

type Expense = {
  id: string;
  category: string;
  amount: number;
  description: string | null;
  date: string;
  createdAt: string;
};

type ExpensesData = {
  expenses: Expense[];
  totalAmount: number;
};

const PRESET_CATEGORIES = [
  "Electricity",
  "Internet",
  "Transport",
  "Cleaning",
  "Maintenance",
  "Staff Welfare",
  "Supplies",
  "Rent",
  "Other",
];

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((d) => d.data);

function buildUrl(cat: string, from: string, to: string) {
  const p = new URLSearchParams();
  if (cat) p.set("category", cat);
  if (from) p.set("from", from);
  if (to) p.set("to", to);
  return `/api/expenses?${p.toString()}`;
}

export default function ExpensesPage() {
  const [catFilter, setCatFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState({ category: "", customCategory: "", amount: "", description: "", date: "" });
  const [saving, setSaving] = useState(false);

  const { data, isLoading, mutate } = useSWR<ExpensesData>(
    buildUrl(catFilter, fromDate, toDate),
    fetcher,
    { refreshInterval: 30000 }
  );

  function openCreate() {
    setEditing(null);
    setForm({ category: PRESET_CATEGORIES[0], customCategory: "", amount: "", description: "", date: new Date().toISOString().slice(0, 10) });
    setShowModal(true);
  }

  function openEdit(exp: Expense) {
    const isPreset = PRESET_CATEGORIES.includes(exp.category);
    setEditing(exp);
    setForm({
      category: isPreset ? exp.category : "Other",
      customCategory: isPreset ? "" : exp.category,
      amount: String(Number(exp.amount)),
      description: exp.description ?? "",
      date: exp.date.slice(0, 10),
    });
    setShowModal(true);
  }

  async function save() {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
    const resolvedCategory = form.category === "Other" && form.customCategory.trim()
      ? form.customCategory.trim()
      : form.category;
    if (!resolvedCategory) { toast.error("Select a category"); return; }

    setSaving(true);
    try {
      const url = editing ? `/api/expenses/${editing.id}` : "/api/expenses";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: resolvedCategory,
          amount,
          description: form.description || undefined,
          date: form.date || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success(editing ? "Expense updated" : "Expense recorded");
      setShowModal(false);
      mutate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function deleteExpense(id: string) {
    if (!confirm("Delete this expense?")) return;
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) { toast.success("Deleted"); mutate(); }
    else toast.error("Failed to delete");
  }

  // Category breakdown from current data
  const categoryTotals = (data?.expenses ?? []).reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + Number(e.amount);
    return acc;
  }, {});

  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Expenses"
        accent="tracker"
        description="Record and monitor day-to-day operational costs."
        action={
          <button
            onClick={openCreate}
            className="rounded-lg bg-[hsl(var(--navy))] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[hsl(var(--navy-3))]"
          >
            + Add expense
          </button>
        }
      />

      <PageBody>
        {/* Stats */}
        <div className="grid gap-5 sm:grid-cols-3">
          <StatTile
            eyebrow="Total expenses"
            value={isLoading ? "…" : formatCurrency(data?.totalAmount ?? 0)}
            footnote="For current filter range."
            tone="red"
          />
          <StatTile
            eyebrow="Total records"
            value={isLoading ? "…" : String(data?.expenses?.length ?? 0)}
            tone="navy"
          />
          <StatTile
            eyebrow="Top category"
            value={topCategory ? topCategory[0] : "—"}
            footnote={topCategory ? formatCurrency(topCategory[1]) : "No data yet."}
            tone="gold"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
              Category
            </label>
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--navy))]/20"
            >
              <option value="">All categories</option>
              {PRESET_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
              From
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--navy))]/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
              To
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--navy))]/20"
            />
          </div>
          {(catFilter || fromDate || toDate) && (
            <button
              onClick={() => { setCatFilter(""); setFromDate(""); setToDate(""); }}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-[12px] text-neutral-500 hover:bg-[hsl(var(--offwhite))]"
            >
              Clear filters
            </button>
          )}
        </div>

        <Panel eyebrow="All expenses" title="Expense" accent="records">
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="ed-thead">
                  <th className="px-6 py-3.5 md:px-7">Date</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Description</th>
                  <th className="px-4 py-3.5 text-right">Amount</th>
                  <th className="px-6 py-3.5 md:px-7"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-neutral-100">
                      <td colSpan={5} className="h-12 animate-pulse bg-neutral-50/60" />
                    </tr>
                  ))
                ) : (data?.expenses?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState message="No expenses recorded yet. Add your first one above." />
                    </td>
                  </tr>
                ) : (
                  data!.expenses.map((e) => (
                    <tr key={e.id} className="ed-row">
                      <td className="px-6 py-3.5 text-[12px] text-neutral-400 md:px-7">
                        {formatDate(e.date)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-full bg-[hsl(var(--navy))]/8 px-2.5 py-0.5 text-[11.5px] font-medium text-[hsl(var(--navy))]">
                          {e.category}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-neutral-500">{e.description ?? "—"}</td>
                      <td className="px-4 py-3.5 text-right font-medium text-[hsl(var(--navy))]">
                        {formatCurrency(Number(e.amount))}
                      </td>
                      <td className="px-6 py-3.5 md:px-7">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(e)}
                            className="rounded p-1 text-neutral-400 hover:bg-[hsl(var(--offwhite))] hover:text-[hsl(var(--navy))]"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => deleteExpense(e.id)}
                            className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
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

      {/* Add / Edit modal */}
      {showModal && (
        <Modal
          eyebrow="Operations"
          title={editing ? "Edit expense" : "Add expense"}
          onClose={() => setShowModal(false)}
        >
          <div className="space-y-4 px-6 py-5">
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full rounded-lg border border-neutral-200 px-3.5 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--navy))]/20"
              >
                {PRESET_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {form.category === "Other" && (
                <input
                  type="text"
                  placeholder="Custom category name…"
                  value={form.customCategory}
                  onChange={(e) => setForm((f) => ({ ...f, customCategory: e.target.value }))}
                  className="mt-2 w-full rounded-lg border border-neutral-200 px-3.5 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--navy))]/20"
                />
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                Amount (GMD)
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="w-full rounded-lg border border-neutral-200 px-3.5 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--navy))]/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                Date
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full rounded-lg border border-neutral-200 px-3.5 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--navy))]/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                Description (optional)
              </label>
              <textarea
                rows={2}
                placeholder="Brief note about this expense…"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full resize-none rounded-lg border border-neutral-200 px-3.5 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--navy))]/20"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4">
            <button
              onClick={() => setShowModal(false)}
              className="rounded-lg px-4 py-2 text-[13px] font-medium text-neutral-500 hover:bg-[hsl(var(--offwhite))]"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-[hsl(var(--navy))] px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[hsl(var(--navy-3))] disabled:opacity-50"
            >
              {saving ? "Saving…" : editing ? "Update" : "Save expense"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
