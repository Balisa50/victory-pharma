"use client";

import { use, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Star, AlertCircle } from "lucide-react";
import { formatCurrency, formatDateTime, PAYMENT_METHOD_LABELS } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { OrderTimeline } from "@/components/shared/OrderTimeline";
import { PaymentModal } from "@/components/retail/PaymentModal";
import { ComplaintModal } from "@/components/retail/ComplaintModal";
import { PageHeader, PageBody, Panel } from "@/components/shared/Editorial";
import type { OrderWithRelations } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((d) => d.data);

export default function RetailOrderDetailPage({
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
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [complaintOpen, setComplaintOpen] = useState(false);

  if (isLoading) {
    return (
      <>
        <PageHeader
          eyebrow="Order"
          title="Loading"
          accent="order"
          back={{ href: "/retail/orders", label: "Back to orders" }}
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
          back={{ href: "/retail/orders", label: "Back to orders" }}
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

  const canReview = (order.status === "delivered" || order.status === "completed") && !order.review;
  const canComplain = !["delivered", "completed", "cancelled"].includes(order.status);
  const canPay =
    !order.payment && !["delivered", "completed", "cancelled"].includes(order.status);

  return (
    <>
      <PageHeader
        eyebrow={`Placed ${formatDateTime(order.createdAt)}`}
        title="Order"
        accent={`#${order.id.slice(-8).toUpperCase()}`}
        back={{ href: "/retail/orders", label: "Back to orders" }}
        action={
          <>
            {canPay && (
              <button onClick={() => setPaymentOpen(true)} className="btn btn-red">
                Submit payment
              </button>
            )}
            {canComplain && (
              <button
                onClick={() => setComplaintOpen(true)}
                className="btn btn-ghost"
              >
                <AlertCircle className="h-4 w-4" />
                Report an issue
              </button>
            )}
            {canReview && (
              <Link
                href={`/retail/orders/${id}/review`}
                className="btn btn-navy"
              >
                <Star className="h-4 w-4" />
                Leave a review
              </Link>
            )}
            {order.receipt && (
              <Link
                href={`/retail/receipts/${order.receipt.id}`}
                className="btn btn-ghost"
              >
                View receipt
              </Link>
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
                      <td className="px-6 py-3.5 md:px-7">
                        <span className="font-medium text-[hsl(var(--navy))]">
                          {item.productName}
                        </span>
                        <span className="ml-2 text-[10.5px] uppercase tracking-[0.12em] text-neutral-400">
                          {item.packLevel}
                        </span>
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
                  {Number(order.discountAmount) > 0 && (
                    <>
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 pt-4 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400"
                        >
                          Subtotal
                        </td>
                        <td className="px-6 pt-4 text-right text-[13.5px] text-neutral-500 md:px-7">
                          {formatCurrency(Number(order.subtotal ?? order.totalAmount))}
                        </td>
                      </tr>
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 pt-1 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--red-2))]"
                        >
                          Discount
                          {order.discountType === "percentage" && order.discountValue
                            ? ` (${Number(order.discountValue)}%)`
                            : ""}
                        </td>
                        <td className="px-6 pt-1 text-right text-[13.5px] text-[hsl(var(--red-2))] md:px-7">
                          -{formatCurrency(Number(order.discountAmount))}
                        </td>
                      </tr>
                    </>
                  )}
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 pt-4 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400"
                    >
                      {Number(order.discountAmount) > 0 ? "Final total" : "Total"}
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
                    {PAYMENT_METHOD_LABELS[order.payment.method]}
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
                </div>
              </Panel>
            )}

            {/* Review */}
            {order.review && (
              <Panel eyebrow="Submitted" title="Your" accent="review">
                <div className="px-6 py-6 md:px-7">
                  <div className="mb-3 flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < order.review!.rating
                            ? "fill-[hsl(var(--gold))] text-[hsl(var(--gold))]"
                            : "text-neutral-200"
                        }`}
                      />
                    ))}
                  </div>
                  {order.review.comment && (
                    <p className="serif text-[15px] italic leading-relaxed text-neutral-600">
                      {order.review.comment}
                    </p>
                  )}
                </div>
              </Panel>
            )}
          </div>

          {/* Timeline */}
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
      </PageBody>

      {paymentOpen && (
        <PaymentModal
          order={order}
          onClose={() => setPaymentOpen(false)}
          onSubmitted={() => {
            setPaymentOpen(false);
            mutate();
          }}
        />
      )}
      {complaintOpen && (
        <ComplaintModal
          orderId={id}
          onClose={() => setComplaintOpen(false)}
          onSubmitted={() => setComplaintOpen(false)}
        />
      )}
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
