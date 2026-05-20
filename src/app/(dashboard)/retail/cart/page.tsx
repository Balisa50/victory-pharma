"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Minus, Plus, Trash2, ShoppingBag, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useCart, useCartActions } from "@/contexts/CartContext";
import { EmptyState } from "@/components/shared/EmptyState";

export default function CartPage() {
  const router = useRouter();
  const { state, total } = useCart();
  const { removeItem, updateQuantity, clearCart } = useCartActions();
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    if (state.items.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: state.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      });
      const json = (await res.json()) as { success: boolean; data?: { id: string }; error?: string };
      if (json.success && json.data) {
        clearCart();
        toast.success("Order placed successfully!");
        router.push(`/retail/orders/${json.data.id}`);
      } else {
        toast.error(json.error ?? "Checkout failed");
      }
    } finally {
      setLoading(false);
    }
  }

  if (state.items.length === 0) {
    return (
      <div className="p-6">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Cart</h1>
        <EmptyState message="Your cart is empty" />
        <div className="mt-4 text-center">
          <Link href="/retail/catalog" className="text-sm font-medium text-blue-600 hover:underline">
            Browse catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Cart</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {state.items.map((item) => (
            <div key={item.productId} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                <p className="text-sm text-gray-500">{formatCurrency(item.price)} each</p>
                <p className="text-xs text-gray-400">{item.stock} available</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  disabled={item.quantity >= item.stock}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <p className="w-24 text-right font-semibold text-gray-900">
                {formatCurrency(item.price * item.quantity)}
              </p>
              <button
                onClick={() => removeItem(item.productId)}
                className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm self-start">
          <h2 className="mb-4 font-semibold text-gray-900">Order Summary</h2>
          <div className="space-y-2 border-b border-gray-100 pb-4">
            {state.items.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm text-gray-600">
                <span className="truncate pr-2">{item.name} × {item.quantity}</span>
                <span className="shrink-0">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between py-4 text-lg font-bold text-gray-900">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
            {loading ? "Placing order..." : "Proceed to Checkout"}
          </button>
        </div>
      </div>
    </div>
  );
}
