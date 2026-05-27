import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createOrderSchema } from "@/lib/validation/order";
import { unitsForPack } from "@/lib/packaging";
import type { OrderStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const isAdmin = (session.user.role === "wholesale_admin" || session.user.role === "manager");
  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Number(searchParams.get("limit") ?? "20");

  const where = {
    ...(isAdmin ? {} : { retailPharmacyId: session.user.id }),
    ...(status ? { status: status as OrderStatus } : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        orderItems: true,
        payment: true,
        statusHistory: { orderBy: { changedAt: "asc" } },
        review: true,
        complaints: true,
        receipt: true,
        retailPharmacy: { select: { id: true, name: true, pharmacyName: true, phone: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({ success: true, data: { orders, total, pages: Math.ceil(total / limit) } });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "retail_pharmacy") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  if (session.user.status !== "active") {
    return NextResponse.json({ success: false, error: "Account not approved" }, { status: 403 });
  }

  const body: unknown = await req.json();
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { items, isCredit, notes, deliveryAddress } = parsed.data;

  try {
    const order = await prisma.$transaction(async (tx) => {
      const productIds = Array.from(new Set(items.map((i) => i.productId)));
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, availabilityStatus: true, deletedAt: null },
      });

      if (products.length !== productIds.length) {
        throw new Error("One or more products are no longer available");
      }

      // MOQ enforcement: each line must meet the product's minimum order quantity (in packs).
      for (const item of items) {
        const product = products.find((p) => p.id === item.productId)!;
        if (item.quantity < product.minOrderQuantity) {
          throw new Error(
            `${product.name} has a minimum order of ${product.minOrderQuantity} ${item.packLevel}${product.minOrderQuantity === 1 ? "" : "s"}`
          );
        }
      }

      // Convert every line into base units; total demand per product.
      const baseUnitsByProduct = new Map<string, number>();
      const lines = items.map((item) => {
        const product = products.find((p) => p.id === item.productId)!;
        const unitsPerPack = unitsForPack(product, item.packLevel);
        const pricePerPack = Number(product.price) * unitsPerPack;
        const baseUnits = unitsPerPack * item.quantity;
        baseUnitsByProduct.set(
          item.productId,
          (baseUnitsByProduct.get(item.productId) ?? 0) + baseUnits
        );
        return {
          productId: item.productId,
          productName: product.name,
          packLevel: item.packLevel,
          unitsPerPack,
          quantity: item.quantity,
          unitPrice: pricePerPack,
          subtotal: pricePerPack * item.quantity,
        };
      });

      // Validate against unified base-unit stock.
      for (const product of products) {
        const required = baseUnitsByProduct.get(product.id) ?? 0;
        if (product.stockUnits < required) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }
      }

      const totalAmount = lines.reduce((sum, l) => sum + l.subtotal, 0);

      const newOrder = await tx.order.create({
        data: {
          retailPharmacyId: session.user.id,
          totalAmount,
          subtotal: totalAmount, // pre-discount; equals totalAmount until admin applies one
          isCredit: isCredit ?? false,
          notes: notes ?? null,
          deliveryAddress: deliveryAddress ?? null,
          status: "pending",
          orderItems: {
            create: lines.map((l) => ({
              productId: l.productId,
              productName: l.productName,
              packLevel: l.packLevel,
              unitsPerPack: l.unitsPerPack,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              subtotal: l.subtotal,
            })),
          },
          statusHistory: {
            create: { status: "pending", changedBy: session.user.id },
          },
        },
        include: { orderItems: true, statusHistory: true },
      });

      // Deduct base units and log a movement per product.
      for (const [productId, baseUnits] of Array.from(baseUnitsByProduct.entries())) {
        await tx.product.update({
          where: { id: productId },
          data: { stockUnits: { decrement: baseUnits } },
        });
        await tx.stockMovement.create({
          data: {
            productId,
            actionType: "ORDER_DEDUCTION",
            quantity: -baseUnits,
            note: `Order ${newOrder.id.slice(-8).toUpperCase()}`,
          },
        });
      }

      return newOrder;
    });

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Order creation failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
