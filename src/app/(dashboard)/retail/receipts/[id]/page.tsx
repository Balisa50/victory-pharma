"use client";

import { use, useState } from "react";
import { Download, Printer } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import useSWR from "swr";
import { PageHeader, PageBody, Panel } from "@/components/shared/Editorial";
import { ThermalReceipt } from "@/components/receipts/ThermalReceipt";
import type { OrderItem } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((d) => d.data);

type ReceiptData = {
  id: string;
  receiptNumber: string;
  orderId: string;
  totalAmount: unknown;
  generatedAt: string;
  printedCount: number;
  retailPharmacy: {
    name: string;
    pharmacyName: string | null;
    phone: string;
    email: string;
  };
  order: {
    id: string;
    createdAt: string;
    subtotal: unknown;
    discountType: string | null;
    discountValue: unknown;
    discountAmount: unknown;
    deliveryFee: unknown;
    orderItems: OrderItem[];
    payment: { method: string; status: string; amount: unknown } | null;
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

  async function handlePrint() {
    // Best-effort print tracking; never block the print dialog.
    fetch(`/api/receipts/${id}/print`, { method: "POST" }).catch(() => {});
    window.print();
  }

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
          receiptId: receipt.receiptNumber,
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
      a.download = `${receipt.receiptNumber}.pdf`;
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
          <div className="mx-auto h-96 max-w-sm animate-pulse rounded-2xl bg-white" />
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

  return (
    <>
      <PageHeader
        eyebrow={formatDateTime(receipt.generatedAt)}
        title="Receipt"
        accent={receipt.receiptNumber}
        back={{ href: "/retail/receipts", label: "Back to receipts" }}
        action={
          <>
            <button onClick={handlePrint} className="btn btn-navy no-print">
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="btn btn-red no-print"
            >
              <Download className="h-4 w-4" />
              {downloading ? "Generating..." : "Download PDF"}
            </button>
          </>
        }
      />

      <PageBody>
        <div className="flex flex-col items-center gap-3">
          {/* On-screen paper slip - also the print target */}
          <div className="rounded-xl bg-white shadow-[0_12px_40px_rgba(13,31,78,0.12)] ring-1 ring-[hsl(var(--navy))]/5">
            <ThermalReceipt
              receiptNumber={receipt.receiptNumber}
              generatedAt={receipt.generatedAt}
              pharmacyName={
                receipt.retailPharmacy.pharmacyName ??
                receipt.retailPharmacy.name
              }
              orderId={receipt.orderId}
              items={receipt.order.orderItems.map((i) => ({
                id: i.id,
                productName: i.productName,
                packLevel: i.packLevel,
                quantity: i.quantity,
                unitPrice: Number(i.unitPrice),
                subtotal: Number(i.subtotal),
              }))}
              totalAmount={Number(receipt.totalAmount)}
              subtotal={
                receipt.order.subtotal != null
                  ? Number(receipt.order.subtotal)
                  : null
              }
              discountAmount={
                receipt.order.discountAmount != null
                  ? Number(receipt.order.discountAmount)
                  : null
              }
              discountType={receipt.order.discountType}
              discountValue={
                receipt.order.discountValue != null
                  ? Number(receipt.order.discountValue)
                  : null
              }
              deliveryFee={
                receipt.order.deliveryFee != null
                  ? Number(receipt.order.deliveryFee)
                  : null
              }
              paymentMethod={receipt.order.payment?.method ?? null}
              paid={receipt.order.payment?.status === "confirmed"}
              contactPhone={
                process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "+220 000 0000"
              }
            />
          </div>

          <p className="no-print text-[11.5px] text-neutral-400">
            Printed {receipt.printedCount}{" "}
            {receipt.printedCount === 1 ? "time" : "times"} · 80mm thermal
            format
          </p>
        </div>
      </PageBody>
    </>
  );
}
