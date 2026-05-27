import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  deliveryFee: z.number().min(0).max(1_000_000),
  deliveryAddress: z.string().max(300).optional().nullable(),
});

/** Admin/manager updates the delivery fee + address on an order. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "wholesale_admin" && role !== "manager") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body: unknown = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const existing = await prisma.order.findUnique({
    where: { id },
    select: { id: true, status: true, subtotal: true, totalAmount: true, discountAmount: true, deliveryFee: true },
  });
  if (!existing) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }
  if (existing.status === "delivered" || existing.status === "cancelled") {
    return NextResponse.json(
      { success: false, error: "Order is locked and cannot be modified" },
      { status: 400 }
    );
  }

  // Recompute total: (subtotal - discount) + new delivery fee.
  const subtotal = Number(existing.subtotal ?? existing.totalAmount);
  const discountAmount = Number(existing.discountAmount ?? 0);
  const prevFee = Number(existing.deliveryFee ?? 0);
  const baseTotal = Number(existing.totalAmount) - prevFee;
  // baseTotal already reflects subtotal - discount, so just add the new fee.
  const _ = subtotal; // referenced for clarity; baseTotal is the source of truth
  void _;
  void discountAmount;
  const newTotal = baseTotal + parsed.data.deliveryFee;

  const updated = await prisma.order.update({
    where: { id },
    data: {
      deliveryFee: parsed.data.deliveryFee,
      ...(parsed.data.deliveryAddress !== undefined && {
        deliveryAddress: parsed.data.deliveryAddress,
      }),
      totalAmount: newTotal,
    },
    include: {
      orderItems: true,
      payment: true,
      retailPharmacy: { select: { id: true, name: true, pharmacyName: true } },
    },
  });

  return NextResponse.json({ success: true, data: updated });
}
