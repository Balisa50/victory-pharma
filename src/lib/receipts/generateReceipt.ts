import type { Prisma } from "@prisma/client";
import { nextReceiptNumber } from "./receiptNumber";

/**
 * Ensures an order has a receipt. Idempotent: if a receipt already exists it
 * is returned untouched. Must run inside a transaction so the receipt number
 * is allocated atomically.
 */
export async function ensureReceipt(
  tx: Prisma.TransactionClient,
  orderId: string
) {
  const existing = await tx.receipt.findUnique({ where: { orderId } });
  if (existing) return existing;

  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: { retailPharmacyId: true, totalAmount: true },
  });
  if (!order) return null;

  const receiptNumber = await nextReceiptNumber(tx);
  return tx.receipt.create({
    data: {
      orderId,
      retailPharmacyId: order.retailPharmacyId,
      totalAmount: order.totalAmount,
      receiptNumber,
    },
  });
}
