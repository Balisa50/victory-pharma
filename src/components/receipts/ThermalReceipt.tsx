import { formatCurrency, formatDateTime } from "@/lib/utils";
import { PACK_LABELS, type PackLevel } from "@/lib/packaging";

export type ThermalReceiptItem = {
  id: string;
  productName: string;
  packLevel: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type ThermalReceiptProps = {
  receiptNumber: string;
  generatedAt: string | Date;
  pharmacyName: string;
  orderId: string;
  items: ThermalReceiptItem[];
  totalAmount: number;
  /** Pre-discount sum. Only shown when a discount has been applied. */
  subtotal?: number | null;
  /** Amount the discount took off the subtotal. */
  discountAmount?: number | null;
  /** "percentage" or "fixed" — used to annotate the discount line. */
  discountType?: string | null;
  discountValue?: number | null;
  /** Optional delivery fee added on top of (subtotal - discount). */
  deliveryFee?: number | null;
  paymentMethod: string | null;
  paid: boolean;
  contactPhone: string;
};

function Rule() {
  return <div className="my-1.5 border-t border-dashed border-black/60" />;
}

/**
 * POS-style thermal receipt (80mm). Rendered on screen and used as the
 * print target — see the `@media print` rules in globals.css.
 */
export function ThermalReceipt({
  receiptNumber,
  generatedAt,
  pharmacyName,
  orderId,
  items,
  totalAmount,
  subtotal,
  discountAmount,
  discountType,
  discountValue,
  deliveryFee,
  paymentMethod,
  paid,
  contactPhone,
}: ThermalReceiptProps) {
  const discount = Number(discountAmount ?? 0);
  const fee = Number(deliveryFee ?? 0);
  const showBreakdown = discount > 0 || fee > 0;
  return (
    <div className="thermal-receipt mx-auto bg-white font-mono text-[12px] leading-snug text-black">
      {/* Letterhead */}
      <div className="text-center">
        <p className="text-[15px] font-bold tracking-wide">
          VICTORY PHARMACEUTICAL
        </p>
        <p>Wholesale Pharmaceuticals</p>
        <p>The Gambia</p>
        <p>Tel: {contactPhone}</p>
      </div>

      <Rule />

      {/* Receipt meta */}
      <div className="space-y-0.5">
        <div className="flex justify-between">
          <span>Receipt</span>
          <span className="font-bold">{receiptNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Order</span>
          <span>#{orderId.slice(-8).toUpperCase()}</span>
        </div>
        <div className="flex justify-between">
          <span>Date</span>
          <span>{formatDateTime(generatedAt)}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span>Pharmacy</span>
          <span className="truncate text-right">{pharmacyName}</span>
        </div>
      </div>

      <Rule />

      {/* Items */}
      <div>
        <div className="flex justify-between font-bold uppercase">
          <span>Item</span>
          <span>Amount</span>
        </div>
        <div className="my-1 border-t border-dotted border-black/50" />
        {items.map((item) => (
          <div key={item.id} className="mb-1.5">
            <p className="font-bold">{item.productName}</p>
            <div className="flex justify-between">
              <span>
                {item.quantity}{" "}
                {PACK_LABELS[item.packLevel as PackLevel] ?? "Unit"} x{" "}
                {formatCurrency(item.unitPrice)}
              </span>
              <span>{formatCurrency(item.subtotal)}</span>
            </div>
          </div>
        ))}
      </div>

      <Rule />

      {/* Totals */}
      {showBreakdown && (
        <>
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(Number(subtotal ?? totalAmount + discount - fee))}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between">
              <span>
                Discount
                {discountType === "percentage" && discountValue
                  ? ` (${Number(discountValue)}%)`
                  : ""}
              </span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          {fee > 0 && (
            <div className="flex justify-between">
              <span>Delivery fee</span>
              <span>{formatCurrency(fee)}</span>
            </div>
          )}
        </>
      )}
      <div className="flex justify-between text-[14px] font-bold">
        <span>TOTAL</span>
        <span>{formatCurrency(totalAmount)}</span>
      </div>
      <div className="mt-1 flex justify-between">
        <span>Payment</span>
        <span>
          {paymentMethod ? paymentMethod.replace(/_/g, " ") : "Not recorded"}
          {" — "}
          {paid ? "PAID" : "PENDING"}
        </span>
      </div>

      <Rule />

      {/* Footer */}
      <div className="text-center">
        <p>Thank you for your business.</p>
        <p>Goods checked and expiry-verified.</p>
        <p className="mt-1.5 text-[10px]">Victory Pharmaceutical</p>
      </div>
    </div>
  );
}
