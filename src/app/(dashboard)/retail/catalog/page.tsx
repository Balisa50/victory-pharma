"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Search, ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/shared/LoadingSkeleton";
import { useCartActions } from "@/contexts/CartContext";
import type { Product } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((d) => d.data);

type CatalogData = { products: Product[]; total: number; pages: number; categories: string[] };

function useDebounce(value: string, ms = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export default function CatalogPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState("name_asc");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const { addItem } = useCartActions();

  const params = new URLSearchParams({
    ...(debouncedSearch.length >= 2 ? { search: debouncedSearch } : {}),
    ...(category ? { category } : {}),
    ...(inStock ? { inStock: "true" } : {}),
    sort,
    page: String(page),
  });

  const { data, isLoading } = useSWR<CatalogData>(`/api/products?${params}`, fetcher);

  function handleAddToCart(product: Product) {
    addItem({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: 1,
      stock: product.stockQuantity,
    });
    toast.success(`${product.name} added to cart`);
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Catalog</h1>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search products..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All categories</option>
          {data?.categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="name_asc">Name A-Z</option>
          <option value="price_asc">Price: Low to high</option>
          <option value="price_desc">Price: High to low</option>
        </select>

        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => { setInStock(e.target.checked); setPage(1); }}
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
          />
          In stock only
        </label>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-white p-4">
              <Skeleton className="mb-3 h-5 w-3/4" />
              <Skeleton className="mb-2 h-4 w-1/2" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          ))}
        </div>
      ) : (data?.products?.length ?? 0) === 0 ? (
        <EmptyState message="No products match your search" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data!.products.map((p) => (
            <div key={p.id} className="flex flex-col rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-2 text-xs font-medium uppercase text-blue-600">{p.category}</div>
              <h3 className="mb-1 flex-1 font-semibold text-gray-900">{p.name}</h3>
              <p className="mb-3 text-lg font-bold text-gray-900">{formatCurrency(Number(p.price))}</p>
              <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
                <span>{p.stockQuantity > 0 ? `${p.stockQuantity} in stock` : "Out of stock"}</span>
                {p.stockQuantity < 10 && p.stockQuantity > 0 && (
                  <span className="text-orange-600">Low stock</span>
                )}
              </div>
              <button
                onClick={() => handleAddToCart(p)}
                disabled={p.stockQuantity === 0}
                className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ShoppingCart className="h-4 w-4" />
                Add to cart
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {(data?.pages ?? 0) > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border p-2 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {data?.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data?.pages ?? 1, p + 1))}
            disabled={page === data?.pages}
            className="rounded-lg border p-2 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
