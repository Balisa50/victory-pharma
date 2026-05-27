"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Minus, Plus, Trash2, ShoppingBag, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PACK_LABELS } from "@/lib/packaging";
import { useCart, useCartActions } from "@/contexts/CartContext";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader, PageBody } from "@/components/shared/Editorial";

export default function CartPage() {
  const router = useRouter();
  const { state, total } = useCart();
  const { removeItem, updateQuantity, clearCart } = useCartActions();
  const [loading, setLoading] = useState(false);
  const [isCredit, setIsCredit] = useState(false);
  const [notes, setNotes] = useState("");

  async function handleCheckout() {
    if (state.items.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: state.items.map((i) => ({
            productId: i.productId,
            packLevel: i.packLevel,
            quantity: i.quantity,
          })),
          isCredit,
          notes: notes || undefined,
        }),
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: { id: string };
        error?: string;
      };
      if (json.success && json.data) {
        clearCart();
        toast.success("Order placed successfully");
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
      <>
        <PageHeader eyebrow="Your cart" title="Cart is" accent="empty" />
        <PageBody>
          <div className="rounded-2xl bg-white py-4 ring-1 ring-[hsl(var(--navy))]/5">
            <EmptyState message="Nothing in your cart yet." />
            <div className="pb-8 text-center">
              <Link href="/retail/catalog" className="btn btn-red">
                Browse the catalog
              </Link>
            </div>
          </div>
        </PageBody>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Your cart"
        title="Review &"
        accent="check out"
        description={`${state.items.length} line${
          state.items.length !== 1 ? "s" : ""
        } ready to order.`}
      />

      <PageBody>
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {state.items.map((item) => (
              <div
                key={`${item.productId}:${item.packLevel}`}
                className="flex items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-[hsl(var(--navy))]/5 md:p-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[hsl(var(--navy))]">
                    {item.name}
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-neutral-500">
                    {formatCurrency(item.pricePerPack)} per{" "}
                    {PACK_LABELS[item.packLevel].toLowerCase()}
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-neutral-400">
                    {PACK_LABELS[item.packLevel]}
                    {item.packLevel !== "unit" &&
                      ` · ${item.unitsPerPack} units each`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      updateQuantity(
                        item.productId,
                        item.packLevel,
                        item.quantity - 1
                      )
                    }
                    className="grid h-8 w-8 place-items-center rounded-lg border border-neutral-200 text-[hsl(var(--navy))] transition-colors hover:bg-[hsl(var(--offwhite))]"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-[hsl(var(--navy))]">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateQuantity(
                        item.productId,
                        item.packLevel,
                        item.quantity + 1
                      )
                    }
                    disabled={item.quantity >= item.maxPacks}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-neutral-200 text-[hsl(var(--navy))] transition-colors hover:bg-[hsl(var(--offwhite))] disabled:opacity-40"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <p className="w-24 text-right font-semibold text-[hsl(var(--navy))]">
                  {formatCurrency(item.pricePerPack * item.quantity)}
                </p>
                <button
                  onClick={() => removeItem(item.productId, item.packLevel)}
                  className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-[hsl(var(--red))]/10 hover:text-[hsl(var(--red))]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="self-start overflow-hidden rounded-2xl bg-white ring-1 ring-[hsl(var(--navy))]/5">
            <div className="border-b border-neutral-100 px-6 py-5">
              <p className="eyebrow mb-1 text-[hsl(var(--red-2))]">Summary</p>
              <h2 className="serif text-[18px] text-[hsl(var(--navy))]">
                Order <em className="italic text-[hsl(var(--orange))]">total</em>
              </h2>
            </div>
            <div className="px-6 py-5">
              <div className="space-y-2 border-b border-neutral-100 pb-4">
                {state.items.map((item) => (
                  <div
                    key={`${item.productId}:${item.packLevel}`}
                    className="flex justify-between text-[13px] text-neutral-600"
                  >
                    <span className="truncate pr-2">
                      {item.name} · {PACK_LABELS[item.packLevel]} x{" "}
                      {item.quantity}
                    </span>
                    <span className="shrink-0">
                      {formatCurrency(item.pricePerPack * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-baseline justify-between py-4">
                <span className="eyebrow text-[hsl(var(--red-2))]">Total</span>
                <span
                  className="display text-[hsl(var(--navy))]"
                  style={{ fontSize: "30px" }}
                >
                  {formatCurrency(total)}
                </span>
              </div>
              {/* Credit option */}
              <div className="mb-4 rounded-lg border border-neutral-200 px-4 py-3">
                <label className="flex cursor-pointer items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-medium text-[hsl(var(--navy))]">
                      Order on credit
                    </p>
                    <p className="text-[11.5px] text-neutral-400">
                      Pay later — balance tracked in your account.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isCredit}
                    onChange={(e) => setIsCredit(e.target.checked)}
                    className="h-4 w-4 rounded accent-[hsl(var(--navy))]"
                  />
                </label>
              </div>

              <textarea
                rows={2}
                placeholder="Order notes (optional)…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mb-3 w-full resize-none rounded-lg border border-neutral-200 px-3 py-2 text-[13px] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--navy))]/20"
              />

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="btn btn-red w-full py-3"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingBag className="h-4 w-4" />
                )}
                {loading ? "Placing order..." : isCredit ? "Place credit order" : "Proceed to checkout"}
              </button>
            </div>
          </div>
        </div>
      </PageBody>
    </>
  );
}
