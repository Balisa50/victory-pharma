"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, ImagePlus, X } from "lucide-react";
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

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export function ProductModal({ product, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
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
          imageUrl: product.imageUrl ?? null,
        }
      : { availabilityStatus: true, imageUrl: null },
  });

  const imageUrl = watch("imageUrl");

  useEffect(() => {
    if (!product) reset({ availabilityStatus: true, imageUrl: null });
  }, [product, reset]);

  async function handleFile(file: File) {
    if (!ALLOWED.includes(file.type)) {
      toast.error("Only JPG, PNG or WebP images are allowed");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be under 4 MB");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const json = (await res.json()) as {
        success: boolean;
        data?: { url: string };
        error?: string;
      };
      if (json.success && json.data) {
        setValue("imageUrl", json.data.url, { shouldValidate: true });
        toast.success("Image uploaded");
      } else {
        toast.error(json.error ?? "Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(data: CreateProductInput) {
    setLoading(true);
    try {
      const url = product ? `/api/products/${product.id}` : "/api/products";
      const method = product ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, imageUrl: data.imageUrl || null }),
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
      maxWidth="max-w-md"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-h-[70vh] space-y-3.5 overflow-y-auto px-6 py-5"
      >
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

        <div className="grid grid-cols-2 gap-3.5">
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

        {/* Photo (optional) */}
        <div>
          <label className="field-label">Product photo (optional)</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          {imageUrl ? (
            <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-[hsl(var(--offwhite))] p-2">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-white">
                <Image
                  src={imageUrl}
                  alt="Product"
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <span className="flex-1 truncate text-[12.5px] text-neutral-500">
                Photo attached
              </span>
              <button
                type="button"
                onClick={() => setValue("imageUrl", null)}
                className="grid h-7 w-7 place-items-center rounded-full bg-[hsl(var(--navy))] text-white transition-colors hover:bg-[hsl(var(--red))]"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex w-full items-center gap-3 rounded-lg border border-dashed border-neutral-300 bg-[hsl(var(--offwhite))] px-3.5 py-2.5 text-left text-neutral-500 transition-colors hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--navy))] disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4 shrink-0" />
              )}
              <span className="text-[12.5px] font-medium">
                {uploading ? "Uploading..." : "Upload a photo"}
              </span>
              <span className="ml-auto text-[11px] text-neutral-400">
                JPG/PNG/WebP, 4 MB
              </span>
            </button>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || uploading}
            className="btn btn-red"
          >
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
