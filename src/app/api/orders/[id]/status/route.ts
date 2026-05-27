import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateOrderStatusSchema } from "@/lib/validation/order";
import { ensureReceipt } from "@/lib/receipts/generateReceipt";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered", "cancelled"],
  delivered: [], // locked
  cancelled: [], // locked
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  // Admin and manager can mutate order state. Void requires admin or manager.
  const role = session?.user?.role;
  if (!session?.user || (role !== "wholesale_admin" && role !== "manager")) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  const sessionUser = session.user;

  const body: unknown = await req.json();
  const parsed = updateOrderStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid status" }, { status: 422 });
  }

  const bodyObj = (body ?? {}) as { voidReason?: unknown };
  const voidReason =
    typeof bodyObj.voidReason === "string" && bodyObj.voidReason.trim()
      ? bodyObj.voidReason.trim().slice(0, 500)
      : null;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { payment: true, orderItems: true },
  });
  if (!order) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  // Delivered/cancelled orders are locked from further transitions.
  const allowed = ALLOWED_TRANSITIONS[order.status];
  if (!allowed.includes(parsed.data.status)) {
    return NextResponse.json(
      { success: false, error: `Cannot transition from ${order.status} to ${parsed.data.status}` },
      { status: 400 }
    );
  }

  if (parsed.data.status === "delivered" && order.payment?.status !== "confirmed" && !order.isCredit) {
    return NextResponse.json(
      { success: false, error: "Payment must be confirmed before marking as delivered" },
      { status: 400 }
    );
  }

  const isVoid = parsed.data.status === "cancelled";

  const updated = await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { id },
      data: {
        status: parsed.data.status,
        ...(isVoid && {
          voidedAt: new Date(),
          voidedBy: sessionUser.id,
          voidReason,
        }),
      },
      include: { payment: true, orderItems: true, retailPharmacy: { select: { id: true, name: true, pharmacyName: true, phone: true, email: true } } },
    });

    await tx.orderStatusHistory.create({
      data: { orderId: id, status: parsed.data.status, changedBy: sessionUser.id },
    });

    if (parsed.data.status === "confirmed") {
      await ensureReceipt(tx, id);
    }

    // VOID: restore each line's base units back into sales inventory and log it.
    if (isVoid) {
      const byProduct = new Map<string, number>();
      for (const item of order.orderItems) {
        const restore = item.unitsPerPack * item.quantity;
        byProduct.set(item.productId, (byProduct.get(item.productId) ?? 0) + restore);
      }
      for (const [productId, units] of Array.from(byProduct.entries())) {
        await tx.product.update({
          where: { id: productId },
          data: { stockUnits: { increment: units } },
        });
        await tx.stockMovement.create({
          data: {
            productId,
            actionType: "ORDER_VOID",
            quantity: units,
            adminId: sessionUser.id,
            note: `Voided order ${id.slice(-8).toUpperCase()}${voidReason ? ` — ${voidReason}` : ""}`,
          },
        });
      }
    }

    return updatedOrder;
  });

  return NextResponse.json({ success: true, data: updated });
}
