import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { submitPaymentSchema } from "@/lib/validation/payment";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "retail_pharmacy") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  if (session.user.status !== "active") {
    return NextResponse.json({ success: false, error: "Account not approved" }, { status: 403 });
  }

  const body: unknown = await req.json();
  const parsed = submitPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const order = await prisma.order.findUnique({
    where: { id: parsed.data.orderId },
    include: { payment: true },
  });

  if (!order) return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
  if (order.retailPharmacyId !== session.user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  if (order.payment) {
    return NextResponse.json({ success: false, error: "Payment already submitted" }, { status: 409 });
  }
  if (["delivered", "cancelled"].includes(order.status)) {
    return NextResponse.json({ success: false, error: "Cannot submit payment for this order" }, { status: 400 });
  }

  const payment = await prisma.payment.create({
    data: {
      orderId: parsed.data.orderId,
      amount: parsed.data.amount,
      method: parsed.data.method,
      notes: parsed.data.notes,
      status: "pending_confirmation",
    },
  });

  return NextResponse.json({ success: true, data: payment }, { status: 201 });
}
