import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const ACTIVE_STATUSES = ["pending", "confirmed", "packed", "out_for_delivery"] as const;
const HISTORY_STATUSES = ["delivered", "cancelled"] as const;

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "retail_pharmacy") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const userId = session.user.id;

  const [activeOrders, orderHistory, totalSpendingResult, recentReceipts] = await Promise.all([
    prisma.order.findMany({
      where: { retailPharmacyId: userId, status: { in: [...ACTIVE_STATUSES] } },
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
    }),
    prisma.order.findMany({
      where: { retailPharmacyId: userId, status: { in: [...HISTORY_STATUSES] } },
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
    }),
    prisma.payment.aggregate({
      where: { order: { retailPharmacyId: userId }, status: "confirmed" },
      _sum: { amount: true },
    }),
    prisma.receipt.findMany({
      where: { retailPharmacyId: userId },
      include: { order: true },
      orderBy: { generatedAt: "desc" },
      take: 5,
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      activeOrders,
      orderHistory,
      totalSpending: Number(totalSpendingResult._sum.amount ?? 0),
      recentReceipts,
    },
  });
}
