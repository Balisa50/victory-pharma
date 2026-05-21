"use client";

import { use, useState } from "react";
import useSWR from "swr";
import { Download } from "lucide-react";
import { formatCurrency, formatDate, formatDateTime, PAYMENT_METHOD_LABELS } from "@/lib/utils";
import { PageHeader, PageBody, Panel } from "@/components/shared/Editorial";
import type { OrderItem } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((d) => d.data);

type ReceiptData = {
  id: string;
  orderId: string;
  totalAmount: unknown;
  generatedAt: string;
  retailPharmacy: {
    name: string;
    pharmacyName: string | null;
    phone: string;
    email: string;
  };
  order: {
    id: string;
    createdAt: string;
    totalAmount: unknown;
    orderItems: OrderItem[];
    payment: { method: string; amount: unknown } | null;
  };
};

export default function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: receipt, isLoading } = useSWR<ReceiptData>(
    `/api/receipts/${id}`,
    fetcher
  );
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (!receipt) return;
    setDownloading(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { ReceiptDocument } = await import(
        "@/components/shared/ReceiptDocument"
      );
      const blob = await pdf(
        ReceiptDocument({
          receiptId: receipt.id,
          orderId: receipt.orderId,
          pharmacyName:
            receipt.retailPharmacy.pharmacyName ?? receipt.retailPharmacy.name,
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
      <>
        <PageHeader
          eyebrow="Receipt"
          title="Loading"
          accent="receipt"
          back={{ href: "/retail/receipts", label: "Back to receipts" }}
        />
        <PageBody>
          <div className="h-72 max-w-2xl animate-pulse rounded-2xl bg-white" />
        </PageBody>
      </>
    );
  }

  if (!receipt) {
    return (
      <>
        <PageHeader
          eyebrow="Receipt"
          title="Not"
          accent="found"
          back={{ href: "/retail/receipts", label: "Back to receipts" }}
        />
        <PageBody>
          <Panel>
            <div className="px-7 py-10 text-[13.5px] text-neutral-500">
              This receipt could not be found.
            </div>
          </Panel>
        </PageBody>
      </>
    );
  }

  const meta: { label: string; value: React.ReactNode }[] = [
    { label: "Receipt ID", value: `#${receipt.id.slice(-8).toUpperCase()}` },
    { label: "Order ID", value: `#${receipt.orderId.slice(-8).toUpperCase()}` },
    {
      label: "Pharmacy",
      value:
        receipt.retailPharmacy.pharmacyName ?? receipt.retailPharmacy.name,
    },
    { label: "Date", value: formatDate(receipt.generatedAt) },
    {
      label: "Payment",
      value: receipt.order.payment
        ? PAYMENT_METHOD_LABELS[receipt.order.payment.method]
        : "Not recorded",
    },
    {
      label: "Status",
      value: (
        <span className="font-medium text-[hsl(var(--green))]">Confirmed</span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow={formatDateTime(receipt.generatedAt)}
        title="Receipt"
        accent={`#${receipt.id.slice(-8).toUpperCase()}`}
        back={{ href: "/retail/receipts", label: "Back to receipts" }}
        action={
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="btn btn-red"
          >
            <Download className="h-4 w-4" />
            {downloading ? "Generating..." : "Download PDF"}
          </button>
        }
      />

      <PageBody>
        <div className="max-w-2xl overflow-hidden rounded-2xl bg-white ring-1 ring-[hsl(var(--navy))]/5">
          {/* Letterhead */}
          <div className="border-b-2 border-[hsl(var(--gold))] bg-[hsl(var(--navy))] px-8 py-7 text-white">
            <p className="eyebrow mb-1 text-[hsl(var(--gold))]">
              Payment receipt
            </p>
            <h2 className="serif text-[24px]">
              Victory <span className="text-[hsl(var(--gold))]">Pharmaceutical</span>
            </h2>
          </div>

          <div className="px-8 py-7">
            {/* Meta */}
            <div className="mb-7 grid grid-cols-2 gap-5 sm:grid-cols-3">
              {meta.map(({ label, value }) => (
                <div key={label}>
                  <p className="eyebrow mb-1 text-[hsl(var(--red-2))]">
                    {label}
                  </p>
                  <p className="text-[13.5px] font-medium text-[hsl(var(--navy))]">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* Items */}
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="ed-thead">
                  <th className="py-3">Product</th>
                  <th className="py-3 text-right">Qty</th>
                  <th className="py-3 text-right">Unit price</th>
                  <th className="py-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {receipt.order.orderItems.map((item) => (
                  <tr key={item.id} className="border-b border-neutral-100">
                    <td className="py-3 font-medium text-[hsl(var(--navy))]">
                      {item.productName}
                    </td>
                    <td className="py-3 text-right text-neutral-500">
                      {item.quantity}
                    </td>
                    <td className="py-3 text-right text-neutral-500">
                      {formatCurrency(Number(item.unitPrice))}
                    </td>
                    <td className="py-3 text-right font-medium text-[hsl(var(--navy))]">
                      {formatCurrency(Number(item.subtotal))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td
                    colSpan={3}
                    className="pt-4 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400"
                  >
                    Total
                  </td>
                  <td className="pt-4 text-right">
                    <span
                      className="display text-[hsl(var(--navy))]"
                      style={{ fontSize: "28px" }}
                    >
                      {formatCurrency(Number(receipt.totalAmount))}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>

            <p className="serif mt-8 border-t border-neutral-100 pt-6 text-center text-[13px] italic text-neutral-400">
              Thank you for your business. Victory Pharmaceutical. Quality you
              can trust.
            </p>
          </div>
        </div>
      </PageBody>
    </>
  );
}
