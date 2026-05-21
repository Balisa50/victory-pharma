"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import useSWR from "swr";
import { toast } from "sonner";
import { Search, ChevronLeft, ChevronRight, ShoppingCart, Pill } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  availablePackLevels,
  unitsForPack,
  pricePerPack,
  packsAvailable,
  formatStockBreakdown,
  PACK_LABELS,
  type PackLevel,
} from "@/lib/packaging";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader, PageBody } from "@/components/shared/Editorial";
import { useCartActions } from "@/contexts/CartContext";
import type { Product } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((d) => d.data);

type CatalogData = {
  products: Product[];
  total: number;
  pages: number;
  categories: string[];
};

function useDebounce(value: string, ms = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

function CatalogCard({ product }: { product: Product }) {
  const { addItem } = useCartActions();
  const levels = availablePackLevels(product);
  const [level, setLevel] = useState<PackLevel>(levels[0]);

  const price = pricePerPack({ ...product, price: Number(product.price) }, level);
  const maxPacks = packsAvailable(product, level);
  const unitsPerPack = unitsForPack(product, level);
  const out = maxPacks === 0;

  function handleAdd() {
    addItem({
      productId: product.id,
      name: product.name,
      packLevel: level,
      unitsPerPack,
      pricePerPack: price,
      quantity: 1,
      maxPacks,
    });
    toast.success(`${product.name} (${PACK_LABELS[level]}) added to cart`);
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-[hsl(var(--navy))]/5 transition-shadow hover:shadow-[0_8px_30px_rgba(13,31,78,0.08)]">
      <div className="relative aspect-[4/3] bg-[hsl(var(--offwhite))]">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Pill className="h-8 w-8 text-[hsl(var(--navy))]/15" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="eyebrow mb-2 text-[hsl(var(--red-2))]">{product.category}</p>
        <h3 className="serif mb-3 flex-1 text-[17px] leading-snug text-[hsl(var(--navy))]">
          {product.name}
        </h3>

        {/* Pack-level selector */}
        {levels.length > 1 && (
          <div className="mb-3 flex gap-1 rounded-lg bg-[hsl(var(--offwhite))] p-1">
            {levels.map((lv) => (
              <button
                key={lv}
                onClick={() => setLevel(lv)}
                className={`flex-1 rounded-md py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors ${
                  level === lv
                    ? "bg-[hsl(var(--navy))] text-white"
                    : "text-neutral-500 hover:text-[hsl(var(--navy))]"
                }`}
              >
                {PACK_LABELS[lv]}
              </button>
            ))}
          </div>
        )}

        <p className="display text-[hsl(var(--navy))]" style={{ fontSize: "24px" }}>
          {formatCurrency(price)}
        </p>
        <p className="mb-3 text-[11px] text-neutral-400">
          per {PACK_LABELS[level].toLowerCase()}
          {level !== "unit" && ` (${unitsPerPack} units)`}
        </p>

        <p className="mb-4 text-[12px] text-neutral-500">
          {out ? "Out of stock" : formatStockBreakdown(product)}
        </p>

        <button
          onClick={handleAdd}
          disabled={out}
          className="btn btn-red w-full"
        >
          <ShoppingCart className="h-4 w-4" />
          Add to cart
        </button>
      </div>
    </article>
  );
}

export default function CatalogPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState("name_asc");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const params = new URLSearchParams({
    ...(debouncedSearch.length >= 2 ? { search: debouncedSearch } : {}),
    ...(category ? { category } : {}),
    ...(inStock ? { inStock: "true" } : {}),
    sort,
    page: String(page),
  });

  const { data, isLoading } = useSWR<CatalogData>(`/api/products?${params}`, fetcher);

  const fieldClass =
    "rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-[13px] transition-colors focus:border-[hsl(var(--gold))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--gold))]/20";

  return (
    <>
      <PageHeader
        eyebrow="Wholesale catalog"
        title="Browse the"
        accent="shelves"
        description="Order by unit, bottle, or carton. Search by brand or generic and filter by category."
      />

      <PageBody>
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[12rem] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search products..."
              className={`${fieldClass} w-full pl-9`}
            />
          </div>

          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className={fieldClass}
          >
            <option value="">All categories</option>
            {data?.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className={fieldClass}
          >
            <option value="name_asc">Name A-Z</option>
            <option value="price_asc">Price: Low to high</option>
            <option value="price_desc">Price: High to low</option>
          </select>

          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-[13px] text-[hsl(var(--navy))]">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => {
                setInStock(e.target.checked);
                setPage(1);
              }}
              className="h-4 w-4 rounded border-neutral-300 accent-[hsl(var(--red))]"
            />
            In stock only
          </label>
        </div>

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white p-5 ring-1 ring-[hsl(var(--navy))]/5"
              >
                <Skeleton className="mb-3 h-4 w-1/3" />
                <Skeleton className="mb-2 h-5 w-3/4" />
                <Skeleton className="h-6 w-1/3" />
              </div>
            ))}
          </div>
        ) : (data?.products?.length ?? 0) === 0 ? (
          <div className="rounded-2xl bg-white ring-1 ring-[hsl(var(--navy))]/5">
            <EmptyState message="No products match your search. Try a different term or clear the filters." />
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data!.products.map((p) => (
              <CatalogCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {(data?.pages ?? 0) > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="grid h-9 w-9 place-items-center rounded-lg border border-neutral-200 bg-white text-[hsl(var(--navy))] transition-colors hover:bg-[hsl(var(--offwhite))] disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-[12px] font-medium uppercase tracking-[0.14em] text-neutral-500">
              Page {page} of {data?.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(data?.pages ?? 1, p + 1))}
              disabled={page === data?.pages}
              className="grid h-9 w-9 place-items-center rounded-lg border border-neutral-200 bg-white text-[hsl(var(--navy))] transition-colors hover:bg-[hsl(var(--offwhite))] disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </PageBody>
    </>
  );
}
