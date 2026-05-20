"use client";

import { use, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Star, AlertCircle } from "lucide-react";
import { formatCurrency, formatDateTime, PAYMENT_METHOD_LABELS } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { OrderTimeline } from "@/components/shared/OrderTimeline";
import { Skeleton } from "@/components/shared/LoadingSkeleton";
import { PaymentModal } from "@/components/retail/PaymentModal";
import { ComplaintModal } from "@/components/retail/ComplaintModal";
import type { OrderWithRelations } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((d) => d.data);

export default function RetailOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: order, isLoading, mutate } = useSWR<OrderWithRelations>(
    `/api/orders/${id}`,
    fetcher,
    { refreshInterval: 10000 }
  );
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [complaintOpen, setComplaintOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!order) return <div className="p-6 text-gray-500">Order not found.</div>;

  const canReview = order.status === "delivered" && !order.review;
  const canComplain = !["delivered", "cancelled"].includes(order.status);
  const canPay = !order.payment && !["delivered", "cancelled"].includes(order.status);

  return (
    <div className="p-6">
      <Link href="/retail/orders" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Order #{order.id.slice(-8)}</h1>
          <p className="text-sm text-gray-500">{formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canPay && (
            <button
              onClick={() => setPaymentOpen(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Submit Payment
            </button>
          )}
          {canComplain && (
            <button
              onClick={() => setComplaintOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-orange-300 px-4 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50"
            >
              <AlertCircle className="h-4 w-4" />
              Submit Complaint
            </button>
          )}
          {canReview && (
            <Link
              href={`/retail/orders/${id}/review`}
              className="flex items-center gap-2 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600"
            >
              <Star className="h-4 w-4" />
              Leave Review
            </Link>
          )}
          {order.receipt && (
            <Link
              href={`/retail/receipts/${order.receipt.id}`}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              View Receipt
            </Link>
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
                <div>
                  <p className="text-xs font-medium uppercase text-gray-400">Amount</p>
                  <p className="mt-0.5 text-gray-900">{formatCurrency(Number(order.payment.amount))}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-gray-400">Method</p>
                  <p className="mt-0.5 text-gray-900">{PAYMENT_METHOD_LABELS[order.payment.method]}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-gray-400">Status</p>
                  <p className={`mt-0.5 font-medium ${order.payment.status === "confirmed" ? "text-green-600" : "text-yellow-600"}`}>
                    {order.payment.status === "confirmed" ? "Confirmed" : "Pending confirmation"}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Review (if submitted) */}
          {order.review && (
            <section className="rounded-xl border border-yellow-100 bg-yellow-50 p-6">
              <h2 className="mb-3 font-semibold text-gray-900">Your Review</h2>
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-5 w-5 ${i < order.review!.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                ))}
              </div>
              {order.review.comment && <p className="text-sm text-gray-700">{order.review.comment}</p>}
            </section>
          )}
        </div>

        {/* Timeline */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Status</h2>
            <StatusBadge status={order.status} />
          </div>
          <OrderTimeline history={order.statusHistory} />
        </div>
      </div>

      {paymentOpen && (
        <PaymentModal
          order={order}
          onClose={() => setPaymentOpen(false)}
          onSubmitted={() => { setPaymentOpen(false); mutate(); }}
        />
      )}
      {complaintOpen && (
        <ComplaintModal
          orderId={id}
          onClose={() => setComplaintOpen(false)}
          onSubmitted={() => setComplaintOpen(false)}
        />
      )}
    </div>
  );
}
