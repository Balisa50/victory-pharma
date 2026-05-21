import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateOrderStatusSchema } from "@/lib/validation/order";
import { ensureReceipt } from "@/lib/receipts/generateReceipt";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: [],
};

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user?.role !== "wholesale_admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body: unknown = await req.json();
  const parsed = updateOrderStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid status" }, { status: 422 });
  }

  const order = await prisma.order.findUnique({ where: { id: params.id }, include: { payment: true } });
  if (!order) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  const allowed = ALLOWED_TRANSITIONS[order.status];
  if (!allowed.includes(parsed.data.status)) {
    return NextResponse.json(
      { success: false, error: `Cannot transition from ${order.status} to ${parsed.data.status}` },
      { status: 400 }
    );
  }

  if (parsed.data.status === "delivered" && order.payment?.status !== "confirmed") {
    return NextResponse.json(
      { success: false, error: "Payment must be confirmed before marking as delivered" },
      { status: 400 }
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { id: params.id },
      data: { status: parsed.data.status },
      include: { payment: true, orderItems: true, retailPharmacy: { select: { id: true, name: true, pharmacyName: true, phone: true, email: true } } },
    });

    await tx.orderStatusHistory.create({
      data: { orderId: params.id, status: parsed.data.status, changedBy: session.user.id },
    });

    // A confirmed order earns its receipt (whichever comes first: this or payment).
    if (parsed.data.status === "confirmed") {
      await ensureReceipt(tx, params.id);
    }

    return updatedOrder;
  });

  return NextResponse.json({ success: true, data: updated });
}
