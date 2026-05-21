"use client";

import { use, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { formatCurrency, formatDate, formatDateTime, PAYMENT_METHOD_LABELS } from "@/lib/utils";
import { Skeleton } from "@/components/shared/LoadingSkeleton";
import type { OrderItem } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((d) => d.data);

type ReceiptData = {
  id: string;
  orderId: string;
  totalAmount: unknown;
  generatedAt: string;
  retailPharmacy: { name: string; pharmacyName: string | null; phone: string; email: string };
  order: {
    id: string;
    createdAt: string;
    totalAmount: unknown;
    orderItems: OrderItem[];
    payment: { method: string; amount: unknown } | null;
  };
};

export default function ReceiptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: receipt, isLoading } = useSWR<ReceiptData>(`/api/receipts/${id}`, fetcher);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (!receipt) return;
    setDownloading(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { ReceiptDocument } = await import("@/components/shared/ReceiptDocument");
      const blob = await pdf(
        ReceiptDocument({
          receiptId: receipt.id,
          orderId: receipt.orderId,
          pharmacyName: receipt.retailPharmacy.pharmacyName ?? receipt.retailPharmacy.name,
          items: receipt.order.orderItems,
          totalAmount: Number(receipt.totalAmount),
          date: receipt.generatedAt,
          paymentMethod: receipt.order.payment?.method ?? "cash",
        })
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${receipt.id.slice(-8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!receipt) return <div className="p-6 text-gray-500">Receipt not found.</div>;

  return (
    <div className="p-6">
      <Link href="/retail/receipts" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="h-4 w-4" /> Back to receipts
      </Link>

      <div className="max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Receipt #{receipt.id.slice(-8)}</h1>
            <p className="text-sm text-gray-500">{formatDateTime(receipt.generatedAt)}</p>
          </div>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {downloading ? "Generating..." : "Download PDF"}
          </button>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
          {/* Header */}
          <div className="mb-8 border-b border-gray-100 pb-6">
            <h2 className="text-2xl font-bold text-blue-700">Victory Pharmaceutical</h2>
            <p className="text-sm text-gray-500">Payment Receipt</p>
          </div>

          {/* Meta */}
          <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
            {[
              { label: "Receipt ID", value: `#${receipt.id.slice(-8)}` },
              { label: "Order ID", value: `#${receipt.orderId.slice(-8)}` },
              { label: "Pharmacy", value: receipt.retailPharmacy.pharmacyName ?? receipt.retailPharmacy.name },
              { label: "Date", value: formatDate(receipt.generatedAt) },
              { label: "Payment", value: receipt.order.payment ? PAYMENT_METHOD_LABELS[receipt.order.payment.method] : "Not recorded" },
              { label: "Status", value: <span className="font-medium text-green-600">Confirmed</span> },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs font-medium uppercase text-gray-400">{label}</p>
                <p className="mt-0.5 font-medium text-gray-900">{value}</p>
              </div>
            ))}
          </div>

          {/* Items */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase text-gray-400">
                <th className="pb-3">Product</th>
                <th className="pb-3 text-right">Qty</th>
                <th className="pb-3 text-right">Unit Price</th>
                <th className="pb-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {receipt.order.orderItems.map((item) => (
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
                <td colSpan={3} className="pt-4 text-right text-base font-bold text-gray-700">Total</td>
                <td className="pt-4 text-right text-xl font-bold text-gray-900">
                  {formatCurrency(Number(receipt.totalAmount))}
                </td>
              </tr>
            </tfoot>
          </table>

          <p className="mt-8 border-t border-gray-100 pt-6 text-center text-xs text-gray-400">
            Thank you for your business. Victory Pharmaceutical. Quality you can trust.
          </p>
        </div>
      </div>
    </div>
  );
}
