import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** GET: list all retail pharmacies with their credit balance summary. */
export async function GET() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "wholesale_admin" && role !== "manager") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  // All active retail pharmacies
  const pharmacies = await prisma.user.findMany({
    where: { role: "retail_pharmacy", status: "active" },
    select: {
      id: true,
      name: true,
      pharmacyName: true,
      phone: true,
      email: true,
      location: true,
    },
    orderBy: { name: "asc" },
  });

  const ids = pharmacies.map((p) => p.id);

  // Total credit ordered per pharmacy + oldest unpaid credit order date
  const creditOrders = await prisma.order.groupBy({
    by: ["retailPharmacyId"],
    where: {
      retailPharmacyId: { in: ids },
      isCredit: true,
      status: { not: "cancelled" },
    },
    _sum: { totalAmount: true },
    _count: { _all: true },
    _min: { createdAt: true },
  });

  // Total credit payments made per pharmacy
  const creditPayments = await prisma.creditPayment.groupBy({
    by: ["retailPharmacyId"],
    where: { retailPharmacyId: { in: ids } },
    _sum: { amount: true },
  });

  const orderMap = new Map(creditOrders.map((r) => [r.retailPharmacyId, r]));
  const paymentMap = new Map(creditPayments.map((r) => [r.retailPharmacyId, r]));

  const now = Date.now();
  const data = pharmacies
    .map((p) => {
      const o = orderMap.get(p.id);
      const ordered = Number(o?._sum.totalAmount ?? 0);
      const paid = Number(paymentMap.get(p.id)?._sum.amount ?? 0);
      const outstanding = Math.max(0, ordered - paid);
      const creditOrderCount = o?._count._all ?? 0;
      const oldestCreditAt = o?._min.createdAt ?? null;
      const oldestCreditDays =
        oldestCreditAt && outstanding > 0
          ? Math.floor((now - new Date(oldestCreditAt).getTime()) / 86_400_000)
          : 0;
      // Alert flags: overdue when oldest unpaid credit is older than 30 days; high
      // debt when outstanding exceeds 25,000 (currency units).
      const overdue = outstanding > 0 && oldestCreditDays > 30;
      const highDebt = outstanding >= 25000;
      return {
        ...p,
        totalCreditOrdered: ordered,
        totalPaid: paid,
        outstanding,
        creditOrderCount,
        oldestCreditDays,
        overdue,
        highDebt,
      };
    })
    .sort((a, b) => b.outstanding - a.outstanding);

  return NextResponse.json({ success: true, data });
}
