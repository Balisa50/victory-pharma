import { prisma } from "@/lib/db";

/**
 * Warehouse stock operations. Stock lives in two pools:
 *   warehouseUnits  – bulk reserve held by the admin (never directly sellable)
 *   stockUnits      – sales inventory, the only pool retail can order from
 *
 * Movements between and within the pools are always written atomically
 * alongside a StockMovement audit row.
 */

/** Add stock into the WAREHOUSE pool (e.g. from a supplier delivery). */
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
      data: { warehouseUnits: { increment: params.baseUnits } },
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

/**
 * Transfer stock from the warehouse pool into the sales pool. This is the
 * only way sales stock ever increases.
 */
export async function transferStock(params: {
  productId: string;
  baseUnits: number;
  adminId: string;
  note?: string | null;
}) {
  if (params.baseUnits <= 0) {
    throw new Error("Transfer amount must be positive");
  }
  const product = await prisma.product.findUnique({
    where: { id: params.productId },
    select: { id: true, warehouseUnits: true },
  });
  if (!product) {
    throw new Error("Product not found");
  }
  if (product.warehouseUnits < params.baseUnits) {
    throw new Error("Not enough warehouse stock for this transfer");
  }

  const [updated] = await prisma.$transaction([
    prisma.product.update({
      where: { id: params.productId },
      data: {
        warehouseUnits: { decrement: params.baseUnits },
        stockUnits: { increment: params.baseUnits },
      },
    }),
    prisma.stockMovement.create({
      data: {
        productId: params.productId,
        actionType: "STOCK_TRANSFER",
        quantity: params.baseUnits,
        adminId: params.adminId,
        note:
          params.note ??
          `Transferred ${params.baseUnits} units to sales inventory`,
      },
    }),
  ]);
  return updated;
}

/** Apply a signed manual adjustment to the WAREHOUSE pool. */
export async function adjustStock(params: {
  productId: string;
  adjustment: number;
  reason: string;
  adminId: string;
}) {
  const product = await prisma.product.findUnique({
    where: { id: params.productId },
    select: { id: true, warehouseUnits: true },
  });
  if (!product) {
    throw new Error("Product not found");
  }
  if (product.warehouseUnits + params.adjustment < 0) {
    throw new Error("Adjustment would drive warehouse stock below zero");
  }

  const [updated] = await prisma.$transaction([
    prisma.product.update({
      where: { id: params.productId },
      data: { warehouseUnits: { increment: params.adjustment } },
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
