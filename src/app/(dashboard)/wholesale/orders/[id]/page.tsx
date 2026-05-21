"use client";

import { use, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { OrderTimeline } from "@/components/shared/OrderTimeline";
import { PageHeader, PageBody, Panel } from "@/components/shared/Editorial";
import type { OrderWithRelations } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((d) => d.data);

const STATUS_ACTIONS: Record<string, { label: string; next: string }> = {
  pending: { label: "Confirm order", next: "confirmed" },
  confirmed: { label: "Mark packed", next: "packed" },
  packed: { label: "Mark out for delivery", next: "out_for_delivery" },
  out_for_delivery: { label: "Mark delivered", next: "delivered" },
};

export default function WholesaleOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    data: order,
    isLoading,
    mutate,
  } = useSWR<OrderWithRelations>(`/api/orders/${id}`, fetcher, {
    refreshInterval: 10000,
  });
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
      const res = await fetch(`/api/payments/${order.payment.id}/confirm`, {
        method: "POST",
      });
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
      <>
        <PageHeader
          eyebrow="Order"
          title="Loading"
          accent="order"
          back={{ href: "/wholesale/orders", label: "Back to orders" }}
        />
        <PageBody>
          <div className="h-64 animate-pulse rounded-2xl bg-white" />
        </PageBody>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <PageHeader
          eyebrow="Order"
          title="Not"
          accent="found"
          back={{ href: "/wholesale/orders", label: "Back to orders" }}
        />
        <PageBody>
          <Panel>
            <div className="px-7 py-10 text-[13.5px] text-neutral-500">
              This order could not be found.
            </div>
          </Panel>
        </PageBody>
      </>
    );
  }

  const nextAction = STATUS_ACTIONS[order.status];

  return (
    <>
      <PageHeader
        eyebrow={`Placed ${formatDateTime(order.createdAt)}`}
        title="Order"
        accent={`#${order.id.slice(-8).toUpperCase()}`}
        back={{ href: "/wholesale/orders", label: "Back to orders" }}
        action={
          <>
            {nextAction && (
              <button
                onClick={() => updateStatus(nextAction.next)}
                disabled={!!actionLoading}
                className="btn btn-navy"
              >
                {actionLoading === nextAction.next && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {nextAction.label}
              </button>
            )}
            {order.payment &&
              order.payment.status === "pending_confirmation" && (
                <button
                  onClick={confirmPayment}
                  disabled={!!actionLoading}
                  className="btn btn-red"
                >
                  {actionLoading === "payment" && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Confirm payment
                </button>
              )}
            {["pending", "confirmed"].includes(order.status) && (
              <button
                onClick={() => updateStatus("cancelled")}
                disabled={!!actionLoading}
                className="btn btn-ghost"
              >
                {actionLoading === "cancelled" && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Cancel order
              </button>
            )}
          </>
        }
      />

      <PageBody>
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            {/* Items */}
            <Panel eyebrow="Contents" title="Order" accent="items">
              <table className="w-full text-[13.5px]">
                <thead>
                  <tr className="ed-thead">
                    <th className="px-6 py-3 md:px-7">Product</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Unit price</th>
                    <th className="px-6 py-3 text-right md:px-7">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.orderItems.map((item) => (
                    <tr key={item.id} className="border-b border-neutral-100">
                      <td className="px-6 py-3.5 font-medium text-[hsl(var(--navy))] md:px-7">
                        {item.productName}
                      </td>
                      <td className="px-4 py-3.5 text-right text-neutral-500">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3.5 text-right text-neutral-500">
                        {formatCurrency(Number(item.unitPrice))}
                      </td>
                      <td className="px-6 py-3.5 text-right font-medium text-[hsl(var(--navy))] md:px-7">
                        {formatCurrency(Number(item.subtotal))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 pt-4 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400"
                    >
                      Total
                    </td>
                    <td className="px-6 pt-4 text-right md:px-7">
                      <span
                        className="display text-[hsl(var(--navy))]"
                        style={{ fontSize: "26px" }}
                      >
                        {formatCurrency(Number(order.totalAmount))}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
              <div className="h-3" />
            </Panel>

            {/* Payment */}
            {order.payment && (
              <Panel eyebrow="Settlement" title="Payment" accent="details">
                <div className="grid grid-cols-2 gap-5 px-6 py-6 text-[13.5px] md:px-7 sm:grid-cols-3">
                  <Field label="Amount">
                    {formatCurrency(Number(order.payment.amount))}
                  </Field>
                  <Field label="Method">
                    {order.payment.method.replace("_", " ")}
                  </Field>
                  <Field label="Status">
                    <span
                      className={
                        order.payment.status === "confirmed"
                          ? "font-medium text-[hsl(var(--green))]"
                          : "font-medium text-[hsl(var(--gold))]"
                      }
                    >
                      {order.payment.status === "confirmed"
                        ? "Confirmed"
                        : "Pending confirmation"}
                    </span>
                  </Field>
                  {order.payment.notes && (
                    <div className="col-span-2 sm:col-span-3">
                      <Field label="Notes">{order.payment.notes}</Field>
                    </div>
                  )}
                </div>
              </Panel>
            )}
          </div>

          <div className="space-y-5">
            {/* Pharmacy */}
            <Panel eyebrow="Customer" title="Pharmacy">
              <div className="space-y-4 px-6 py-6 text-[13.5px] md:px-7">
                <Field label="Name">
                  {order.retailPharmacy.pharmacyName ??
                    order.retailPharmacy.name}
                </Field>
                <Field label="Contact">{order.retailPharmacy.name}</Field>
                <Field label="Phone">{order.retailPharmacy.phone}</Field>
                <Field label="Email">{order.retailPharmacy.email}</Field>
              </div>
            </Panel>

            {/* Status */}
            <Panel
              eyebrow="Progress"
              title="Status"
              action={<StatusBadge status={order.status} />}
            >
              <div className="px-6 py-7 md:px-7">
                <OrderTimeline history={order.statusHistory} />
              </div>
            </Panel>
          </div>
        </div>
      </PageBody>
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="eyebrow mb-1 text-[hsl(var(--red-2))]">{label}</p>
      <p className="text-[hsl(var(--navy))]">{children}</p>
    </div>
  );
}
