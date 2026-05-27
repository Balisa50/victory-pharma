import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureReceipt } from "@/lib/receipts/generateReceipt";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (session?.user?.role !== "wholesale_admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const payment = await prisma.payment.findUnique({
    where: { id: id },
    include: { order: { include: { orderItems: true, retailPharmacy: { select: { id: true, name: true, pharmacyName: true } } } } },
  });

  if (!payment) return NextResponse.json({ success: false, error: "Payment not found" }, { status: 404 });
  if (payment.status === "confirmed") {
    return NextResponse.json({ success: false, error: "Payment already confirmed" }, { status: 409 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: id },
      data: { status: "confirmed" },
    });

    // Generate a numbered receipt once payment is confirmed (idempotent).
    await ensureReceipt(tx, payment.orderId);

    return updatedPayment;
  });

  return NextResponse.json({ success: true, data: updated });
}
