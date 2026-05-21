"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  createProductSchema,
  type CreateProductInput,
} from "@/lib/validation/product";
import { Modal } from "@/components/shared/Editorial";
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
    <Modal
      eyebrow="Inventory"
      title={product ? "Edit" : "Add a"}
      accent="product"
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-6">
        <Field label="Name" error={errors.name?.message}>
          <input
            {...register("name")}
            className="field"
            placeholder="Paracetamol 500mg"
          />
        </Field>

        <Field label="Category" error={errors.category?.message}>
          <input
            {...register("category")}
            className="field"
            placeholder="Analgesic"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Price (GMD)" error={errors.price?.message}>
            <input
              {...register("price", { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0.01"
              className="field"
              placeholder="0.00"
            />
          </Field>
          <Field label="Stock quantity" error={errors.stockQuantity?.message}>
            <input
              {...register("stockQuantity", { valueAsNumber: true })}
              type="number"
              min="0"
              className="field"
            />
          </Field>
        </div>

        <Field label="Expiry date (optional)" error={errors.expiryDate?.message}>
          <input {...register("expiryDate")} type="date" className="field" />
        </Field>

        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-neutral-200 bg-[hsl(var(--offwhite))] px-3.5 py-2.5">
          <input
            {...register("availabilityStatus")}
            type="checkbox"
            className="h-4 w-4 rounded border-neutral-300 accent-[hsl(var(--red))]"
          />
          <span className="text-[13px] font-medium text-[hsl(var(--navy))]">
            Available for ordering
          </span>
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn btn-red">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {product ? "Save changes" : "Add product"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

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
      <label className="field-label">{label}</label>
      {children}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
