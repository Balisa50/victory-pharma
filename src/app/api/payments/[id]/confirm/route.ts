import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user?.role !== "wholesale_admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const payment = await prisma.payment.findUnique({
    where: { id: params.id },
    include: { order: { include: { orderItems: true, retailPharmacy: { select: { id: true, name: true, pharmacyName: true } } } } },
  });

  if (!payment) return NextResponse.json({ success: false, error: "Payment not found" }, { status: 404 });
  if (payment.status === "confirmed") {
    return NextResponse.json({ success: false, error: "Payment already confirmed" }, { status: 409 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: params.id },
      data: { status: "confirmed" },
    });

    const existingReceipt = await tx.receipt.findUnique({ where: { orderId: payment.orderId } });
    if (!existingReceipt) {
      await tx.receipt.create({
        data: {
          orderId: payment.orderId,
          retailPharmacyId: payment.order.retailPharmacyId,
          totalAmount: payment.amount,
        },
      });
    }

    return updatedPayment;
  });

  return NextResponse.json({ success: true, data: updated });
}
