"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { createProductSchema, type CreateProductInput } from "@/lib/validation/product";
import type { Product } from "@/types";

type Props = {
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
};

export function ProductModal({ product, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: product
      ? {
          name: product.name,
          category: product.category,
          price: Number(product.price),
          stockQuantity: product.stockQuantity,
          expiryDate: product.expiryDate
            ? new Date(product.expiryDate).toISOString().split("T")[0]
            : undefined,
          availabilityStatus: product.availabilityStatus,
        }
      : { availabilityStatus: true },
  });

  useEffect(() => {
    if (!product) reset({ availabilityStatus: true });
  }, [product, reset]);

  async function onSubmit(data: CreateProductInput) {
    setLoading(true);
    try {
      const url = product ? `/api/products/${product.id}` : "/api/products";
      const method = product ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (json.success) {
        toast.success(product ? "Product updated" : "Product added");
        onSaved();
      } else {
        toast.error(json.error ?? "Failed to save product");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {product ? "Edit product" : "Add product"}
          </h2>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Name" error={errors.name?.message}>
            <input {...register("name")} className={inputCls} placeholder="Paracetamol 500mg" />
          </Field>

          <Field label="Category" error={errors.category?.message}>
            <input {...register("category")} className={inputCls} placeholder="Analgesic" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Price (GMD)" error={errors.price?.message}>
              <input
                {...register("price", { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0.01"
                className={inputCls}
                placeholder="0.00"
              />
            </Field>
            <Field label="Stock quantity" error={errors.stockQuantity?.message}>
              <input
                {...register("stockQuantity", { valueAsNumber: true })}
                type="number"
                min="0"
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Expiry date (optional)" error={errors.expiryDate?.message}>
            <input {...register("expiryDate")} type="date" className={inputCls} />
          </Field>

          <div className="flex items-center gap-3">
            <input
              {...register("availabilityStatus")}
              type="checkbox"
              id="available"
              className="h-4 w-4 rounded border-gray-300 text-emerald-600"
            />
            <label htmlFor="available" className="text-sm font-medium text-gray-700">
              Available for ordering
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {product ? "Save changes" : "Add product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
