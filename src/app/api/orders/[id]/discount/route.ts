import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { applyDiscountSchema } from "@/lib/validation/discount";

/** POST: apply or replace a discount on an order. Admin only. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if ((session?.user?.role !== "wholesale_admin" && session?.user?.role !== "manager")) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body: unknown = await req.json();
  const parsed = applyDiscountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 422 }
    );
  }

  const order = await prisma.order.findUnique({
    where: { id: id },
    include: { payment: true },
  });
  if (!order) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }
  if (order.payment?.status === "confirmed") {
    return NextResponse.json(
      { success: false, error: "Cannot change discount after payment is confirmed" },
      { status: 409 }
    );
  }

  const subtotal = Number(order.subtotal ?? order.totalAmount);
  const { type, value } = parsed.data;

  let discountAmount = type === "percentage" ? (subtotal * value) / 100 : value;
  if (discountAmount > subtotal) discountAmount = subtotal;
  const total = Math.max(0, subtotal - discountAmount);

  const updated = await prisma.order.update({
    where: { id: id },
    data: {
      subtotal: new Prisma.Decimal(subtotal),
      discountType: type,
      discountValue: new Prisma.Decimal(value),
      discountAmount: new Prisma.Decimal(discountAmount),
      totalAmount: new Prisma.Decimal(total),
    },
    select: {
      id: true,
      subtotal: true,
      discountType: true,
      discountValue: true,
      discountAmount: true,
      totalAmount: true,
    },
  });

  return NextResponse.json({ success: true, data: updated });
}

/** DELETE: clear an applied discount. Admin only. */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if ((session?.user?.role !== "wholesale_admin" && session?.user?.role !== "manager")) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  const order = await prisma.order.findUnique({
    where: { id: id },
    include: { payment: true },
  });
  if (!order) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }
  if (order.payment?.status === "confirmed") {
    return NextResponse.json(
      { success: false, error: "Cannot change discount after payment is confirmed" },
      { status: 409 }
    );
  }
  const subtotal = order.subtotal ?? order.totalAmount;
  const updated = await prisma.order.update({
    where: { id: id },
    data: {
      discountType: null,
      discountValue: null,
      discountAmount: new Prisma.Decimal(0),
      totalAmount: subtotal,
    },
    select: { id: true, totalAmount: true },
  });
  return NextResponse.json({ success: true, data: updated });
}
