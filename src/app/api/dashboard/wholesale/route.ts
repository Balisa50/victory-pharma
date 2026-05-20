import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LOW_STOCK_THRESHOLD } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "wholesale_admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    revenueResult,
    pendingPaymentsResult,
    totalOrders,
    lowStockCount,
    recentOrders,
    lowStockProducts,
    dailyRevenue,
  ] = await Promise.all([
    prisma.payment.aggregate({ where: { status: "confirmed" }, _sum: { amount: true } }),
    prisma.order.aggregate({
      where: {
        status: { notIn: ["delivered", "cancelled"] },
        payment: { is: null },
      },
      _sum: { totalAmount: true },
    }),
    prisma.order.count(),
    prisma.product.count({ where: { stockQuantity: { lt: LOW_STOCK_THRESHOLD }, deletedAt: null } }),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        orderItems: true,
        payment: true,
        statusHistory: { orderBy: { changedAt: "asc" } },
        review: true,
        complaints: true,
        receipt: true,
        retailPharmacy: { select: { id: true, name: true, pharmacyName: true, phone: true, email: true } },
      },
    }),
    prisma.product.findMany({
      where: { stockQuantity: { lt: LOW_STOCK_THRESHOLD }, deletedAt: null },
      orderBy: { stockQuantity: "asc" },
    }),
    prisma.$queryRaw<{ date: string; revenue: number }[]>`
      SELECT
        TO_CHAR(p."createdAt", 'YYYY-MM-DD') as date,
        SUM(p.amount)::float as revenue
      FROM payments p
      WHERE p.status = 'confirmed'
        AND p."createdAt" >= ${sevenDaysAgo}
      GROUP BY TO_CHAR(p."createdAt", 'YYYY-MM-DD')
      ORDER BY date ASC
    `,
  ]);

  return NextResponse.json({
    success: true,
    data: {
      totalRevenue: Number(revenueResult._sum.amount ?? 0),
      pendingPayments: Number(pendingPaymentsResult._sum.totalAmount ?? 0),
      totalOrders,
      lowStockCount,
      revenueChart: dailyRevenue,
      recentOrders,
      lowStockProducts,
    },
  });
}
