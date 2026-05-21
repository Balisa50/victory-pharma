"use client";

import { useState } from "react";
import Image from "next/image";
import useSWR from "swr";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Pill } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ProductModal } from "@/components/wholesale/ProductModal";
import { PageHeader, PageBody, Panel } from "@/components/shared/Editorial";
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
    <>
      <PageHeader
        eyebrow="Inventory"
        title="Your"
        accent="catalog"
        description="Everything retail partners can order. Keep stock and pricing current."
        action={
          <button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="btn btn-red"
          >
            <Plus className="h-4 w-4" />
            Add product
          </button>
        }
      />

      <PageBody>
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="ed-thead">
                  <th className="px-6 py-3.5 md:px-7">Name</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Price</th>
                  <th className="px-4 py-3.5">Stock</th>
                  <th className="px-4 py-3.5">Expiry</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right md:px-7">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-neutral-100">
                      <td colSpan={7} className="h-14 animate-pulse bg-neutral-50/60" />
                    </tr>
                  ))
                ) : (data?.products?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState message="No products yet. Add your first product to open the catalog." />
                    </td>
                  </tr>
                ) : (
                  data!.products.map((p) => {
                    const low = p.stockQuantity < 10;
                    return (
                      <tr key={p.id} className="ed-row">
                        <td className="px-6 py-4 md:px-7">
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-[hsl(var(--offwhite))] ring-1 ring-[hsl(var(--navy))]/5">
                              {p.imageUrl ? (
                                <Image
                                  src={p.imageUrl}
                                  alt={p.name}
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center">
                                  <Pill className="h-4 w-4 text-[hsl(var(--navy))]/20" />
                                </div>
                              )}
                            </div>
                            <span className="serif italic text-[hsl(var(--navy))]">
                              {p.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-[11px] uppercase tracking-[0.12em] text-neutral-400">
                          {p.category}
                        </td>
                        <td className="px-4 py-4 font-medium text-[hsl(var(--navy))]">
                          {formatCurrency(Number(p.price))}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={
                              low
                                ? "font-semibold text-[hsl(var(--red-2))]"
                                : "text-neutral-600"
                            }
                          >
                            {p.stockQuantity}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-[12px] text-neutral-400">
                          {p.expiryDate ? formatDate(p.expiryDate) : "Not set"}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                              p.availabilityStatus
                                ? "bg-[hsl(var(--green))]/12 text-[hsl(var(--green))]"
                                : "bg-neutral-100 text-neutral-400"
                            }`}
                          >
                            {p.availabilityStatus ? "Available" : "Unavailable"}
                          </span>
                        </td>
                        <td className="px-6 py-4 md:px-7">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditing(p);
                                setModalOpen(true);
                              }}
                              className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-[hsl(var(--navy))]/8 hover:text-[hsl(var(--navy))]"
                              aria-label="Edit product"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <ConfirmDialog
                              trigger={
                                <button
                                  className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-[hsl(var(--red))]/10 hover:text-[hsl(var(--red))]"
                                  aria-label="Remove product"
                                >
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </PageBody>

      {modalOpen && (
        <ProductModal
          product={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            mutate();
          }}
        />
      )}
    </>
  );
}
