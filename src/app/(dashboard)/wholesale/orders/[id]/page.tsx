"use client";

import { use } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { OrderTimeline } from "@/components/shared/OrderTimeline";
import { Skeleton } from "@/components/shared/LoadingSkeleton";
import type { OrderWithRelations } from "@/types";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((d) => d.data);

const STATUS_ACTIONS: Record<string, { label: string; next: string }> = {
  pending: { label: "Confirm Order", next: "confirmed" },
  confirmed: { label: "Mark Packed", next: "packed" },
  packed: { label: "Mark Out for Delivery", next: "out_for_delivery" },
  out_for_delivery: { label: "Mark Delivered", next: "delivered" },
};

export default function WholesaleOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: order, isLoading, mutate } = useSWR<OrderWithRelations>(
    `/api/orders/${id}`,
    fetcher,
    { refreshInterval: 10000 }
  );
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function updateStatus(status: string) {
    setActionLoading(status);
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (json.success) {
        toast.success("Order status updated");
        await mutate();
      } else {
        toast.error(json.error ?? "Failed to update status");
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function confirmPayment() {
    if (!order?.payment) return;
    setActionLoading("payment");
    try {
      const res = await fetch(`/api/payments/${order.payment.id}/confirm`, { method: "POST" });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (json.success) {
        toast.success("Payment confirmed. Receipt generated");
        await mutate();
      } else {
        toast.error(json.error ?? "Failed to confirm payment");
      }
    } finally {
      setActionLoading(null);
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!order) return <div className="p-6 text-gray-500">Order not found.</div>;

  const nextAction = STATUS_ACTIONS[order.status];

  return (
    <div className="p-6">
      <Link href="/wholesale/orders" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Order #{order.id.slice(-8)}</h1>
          <p className="text-sm text-gray-500">{formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {nextAction && (
            <button
              onClick={() => updateStatus(nextAction.next)}
              disabled={!!actionLoading}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {actionLoading === nextAction.next && <Loader2 className="h-4 w-4 animate-spin" />}
              {nextAction.label}
            </button>
          )}
          {["pending", "confirmed"].includes(order.status) && (
            <button
              onClick={() => updateStatus("cancelled")}
              disabled={!!actionLoading}
              className="flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              {actionLoading === "cancelled" && <Loader2 className="h-4 w-4 animate-spin" />}
              Cancel Order
            </button>
          )}
          {order.payment && order.payment.status === "pending_confirmation" && (
            <button
              onClick={confirmPayment}
              disabled={!!actionLoading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {actionLoading === "payment" && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm Payment
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-gray-900">Order Items</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase text-gray-400">
                  <th className="pb-2">Product</th>
                  <th className="pb-2 text-right">Qty</th>
                  <th className="pb-2 text-right">Unit Price</th>
                  <th className="pb-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.orderItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50">
                    <td className="py-3 font-medium text-gray-900">{item.productName}</td>
                    <td className="py-3 text-right text-gray-500">{item.quantity}</td>
                    <td className="py-3 text-right text-gray-500">{formatCurrency(Number(item.unitPrice))}</td>
                    <td className="py-3 text-right font-medium">{formatCurrency(Number(item.subtotal))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="pt-3 text-right font-semibold text-gray-700">Total</td>
                  <td className="pt-3 text-right text-lg font-bold text-gray-900">
                    {formatCurrency(Number(order.totalAmount))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </section>

          {/* Payment */}
          {order.payment && (
            <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-gray-900">Payment</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <InfoRow label="Amount" value={formatCurrency(Number(order.payment.amount))} />
                <InfoRow label="Method" value={order.payment.method.replace("_", " ")} />
                <InfoRow
                  label="Status"
                  value={
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${order.payment.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {order.payment.status === "confirmed" ? "Confirmed" : "Pending confirmation"}
                    </span>
                  }
                />
                {order.payment.notes && <InfoRow label="Notes" value={order.payment.notes} />}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          {/* Pharmacy */}
          <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-gray-900">Pharmacy</h2>
            <div className="space-y-2 text-sm">
              <InfoRow label="Name" value={order.retailPharmacy.pharmacyName ?? order.retailPharmacy.name} />
              <InfoRow label="Contact" value={order.retailPharmacy.name} />
              <InfoRow label="Phone" value={order.retailPharmacy.phone} />
              <InfoRow label="Email" value={order.retailPharmacy.email} />
            </div>
          </section>

          {/* Status */}
          <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-gray-900">Status</h2>
            <StatusBadge status={order.status} />
            <div className="mt-4">
              <OrderTimeline history={order.statusHistory} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-gray-400">{label}</p>
      <p className="mt-0.5 text-gray-900">{value}</p>
    </div>
  );
}
