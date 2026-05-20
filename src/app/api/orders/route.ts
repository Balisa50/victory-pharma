import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createOrderSchema } from "@/lib/validation/order";
import type { OrderStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.user.role === "wholesale_admin";
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

  const body: unknown = await req.json();
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { items } = parsed.data;

  try {
    const order = await prisma.$transaction(async (tx) => {
      const productIds = items.map((i) => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, availabilityStatus: true, deletedAt: null },
      });

      if (products.length !== productIds.length) {
        throw new Error("One or more products are no longer available");
      }

      for (const item of items) {
        const product = products.find((p) => p.id === item.productId)!;
        if (product.stockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }
      }

      const totalAmount = items.reduce((sum, item) => {
        const product = products.find((p) => p.id === item.productId)!;
        return sum + Number(product.price) * item.quantity;
      }, 0);

      const newOrder = await tx.order.create({
        data: {
          retailPharmacyId: session.user.id,
          totalAmount,
          status: "pending",
          orderItems: {
            create: items.map((item) => {
              const product = products.find((p) => p.id === item.productId)!;
              return {
                productId: item.productId,
                productName: product.name,
                quantity: item.quantity,
                unitPrice: product.price,
                subtotal: Number(product.price) * item.quantity,
              };
            }),
          },
          statusHistory: {
            create: { status: "pending", changedBy: session.user.id },
          },
        },
        include: { orderItems: true, statusHistory: true },
      });

      await Promise.all(
        items.map((item) =>
          tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { decrement: item.quantity } },
          })
        )
      );

      return newOrder;
    });

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Order creation failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
