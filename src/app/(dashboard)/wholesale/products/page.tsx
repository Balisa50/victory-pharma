"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableRowSkeleton } from "@/components/shared/LoadingSkeleton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ProductModal } from "@/components/wholesale/ProductModal";
import type { Product } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((d) => d.data);

export default function ProductsPage() {
  const { data, isLoading, mutate } = useSWR<{ products: Product[]; total: number }>(
    "/api/products?adminView=true&limit=100",
    fetcher
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    const json = (await res.json()) as { success: boolean; error?: string };
    if (json.success) {
      toast.success("Product removed");
      await mutate();
    } else {
      toast.error(json.error ?? "Failed to remove product");
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Add product
        </button>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase text-gray-400">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Expiry</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)
              ) : (data?.products?.length ?? 0) === 0 ? (
                <tr><td colSpan={7}><EmptyState message="No products yet. Add your first product." /></td></tr>
              ) : (
                data!.products.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500">{p.category}</td>
                    <td className="px-4 py-3">{formatCurrency(Number(p.price))}</td>
                    <td className="px-4 py-3">
                      <span className={p.stockQuantity < 10 ? "font-medium text-red-600" : ""}>
                        {p.stockQuantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {p.expiryDate ? formatDate(p.expiryDate) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${p.availabilityStatus ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {p.availabilityStatus ? "Available" : "Unavailable"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditing(p); setModalOpen(true); }}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <ConfirmDialog
                          trigger={
                            <button className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          }
                          title="Remove product"
                          description={`Remove "${p.name}"? This will mark it as unavailable.`}
                          confirmLabel="Remove"
                          destructive
                          onConfirm={() => handleDelete(p.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <ProductModal
          product={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); mutate(); }}
        />
      )}
    </div>
  );
}
