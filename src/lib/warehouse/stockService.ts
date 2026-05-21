import { prisma } from "@/lib/db";

/**
 * Warehouse stock operations. All stock is held in BASE UNITS; every change
 * is written atomically alongside a StockMovement audit record.
 */

/** Add stock (already converted to base units) and log the movement. */
export async function addStock(params: {
  productId: string;
  baseUnits: number;
  adminId: string;
  note?: string | null;
}) {
  if (params.baseUnits <= 0) {
    throw new Error("Stock to add must be positive");
  }
  const [product] = await prisma.$transaction([
    prisma.product.update({
      where: { id: params.productId },
      data: { stockUnits: { increment: params.baseUnits } },
    }),
    prisma.stockMovement.create({
      data: {
        productId: params.productId,
        actionType: "STOCK_ADD",
        quantity: params.baseUnits,
        adminId: params.adminId,
        note: params.note ?? null,
      },
    }),
  ]);
  return product;
}

/** Apply a signed manual adjustment in base units; refuses to go negative. */
export async function adjustStock(params: {
  productId: string;
  adjustment: number;
  reason: string;
  adminId: string;
}) {
  const product = await prisma.product.findUnique({
    where: { id: params.productId },
    select: { id: true, stockUnits: true },
  });
  if (!product) {
    throw new Error("Product not found");
  }
  if (product.stockUnits + params.adjustment < 0) {
    throw new Error("Adjustment would drive stock below zero");
  }

  const [updated] = await prisma.$transaction([
    prisma.product.update({
      where: { id: params.productId },
      data: { stockUnits: { increment: params.adjustment } },
    }),
    prisma.stockMovement.create({
      data: {
        productId: params.productId,
        actionType: "MANUAL_ADJUST",
        quantity: params.adjustment,
        adminId: params.adminId,
        note: params.reason,
      },
    }),
  ]);
  return updated;
}
