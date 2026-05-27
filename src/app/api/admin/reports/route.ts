import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type MonthlyRevenueRow = { month: string; revenue: number };
type TopProductRow = { name: string; units: number; revenue: number };
type TopPharmacyRow = {
  id: string;
  name: string;
  pharmacyName: string | null;
  total: number;
  orders: number;
};
type ExpenseCategoryRow = { category: string; total: number };
type PaymentMethodRow = { method: string; total: number; count: number };

/** GET: admin reports — monthly revenue, top products/pharmacies, status mix, expenses, profit, credit. */
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "wholesale_admin") {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const [
    monthlyRevenue,
    topProducts,
    topPharmacies,
    statusBreakdown,
    expensesByCategory,
    paymentMethodBreakdown,
    totalExpenses,
    creditOrdersTotal,
    creditPaymentsTotal,
  ] = await Promise.all([
    prisma.$queryRaw<MonthlyRevenueRow[]>`
      SELECT TO_CHAR(p."createdAt", 'YYYY-MM') AS month,
             SUM(p.amount)::float AS revenue
      FROM payments p
      WHERE p.status = 'confirmed'
        AND p."createdAt" >= NOW() - INTERVAL '12 months'
      GROUP BY month
      ORDER BY month ASC
    `,
    prisma.$queryRaw<TopProductRow[]>`
      SELECT oi."productName" AS name,
             SUM(oi.quantity * oi."unitsPerPack")::int AS units,
             SUM(oi.subtotal)::float AS revenue
      FROM order_items oi
      GROUP BY oi."productName"
      ORDER BY units DESC
      LIMIT 10
    `,
    prisma.$queryRaw<TopPharmacyRow[]>`
      SELECT u.id,
             u.name,
             u."pharmacyName",
             SUM(o."totalAmount")::float AS total,
             COUNT(o.id)::int AS orders
      FROM orders o
      JOIN users u ON o."retailPharmacyId" = u.id
      GROUP BY u.id, u.name, u."pharmacyName"
      ORDER BY total DESC
      LIMIT 10
    `,
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.$queryRaw<ExpenseCategoryRow[]>`
      SELECT category, SUM(amount)::float AS total
      FROM expenses
      GROUP BY category
      ORDER BY total DESC
    `,
    prisma.$queryRaw<PaymentMethodRow[]>`
      SELECT method, SUM(amount)::float AS total, COUNT(*)::int AS count
      FROM payments
      WHERE status = 'confirmed'
      GROUP BY method
      ORDER BY total DESC
    `,
    prisma.expense.aggregate({ _sum: { amount: true } }),
    prisma.order.aggregate({
      where: { isCredit: true },
      _sum: { totalAmount: true },
    }),
    prisma.creditPayment.aggregate({ _sum: { amount: true } }),
  ]);

  const statusMix = statusBreakdown
    .map((s) => ({ status: s.status, count: s._count._all }))
    .sort((a, b) => b.count - a.count);

  const totalOrders = statusMix.reduce((s, x) => s + x.count, 0);

  const totalRevenueAmount = (monthlyRevenue as MonthlyRevenueRow[]).reduce(
    (s, m) => s + m.revenue,
    0
  );
  const totalExpensesAmount = Number(totalExpenses._sum.amount ?? 0);
  const grossProfit = totalRevenueAmount - totalExpensesAmount;

  const totalCreditIssued = Number(creditOrdersTotal._sum.totalAmount ?? 0);
  const totalCreditPaid = Number(creditPaymentsTotal._sum.amount ?? 0);
  const totalCreditOutstanding = Math.max(0, totalCreditIssued - totalCreditPaid);

  return NextResponse.json({
    success: true,
    data: {
      monthlyRevenue,
      topProducts,
      topPharmacies,
      statusMix,
      totalOrders,
      expensesByCategory,
      paymentMethodBreakdown,
      totalExpenses: totalExpensesAmount,
      grossProfit,
      totalCreditIssued,
      totalCreditOutstanding,
    },
  });
}
