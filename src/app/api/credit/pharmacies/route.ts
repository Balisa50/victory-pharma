import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** GET: list all retail pharmacies with their credit balance summary. */
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "wholesale_admin") {
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

  // Total credit ordered per pharmacy
  const creditOrders = await prisma.order.groupBy({
    by: ["retailPharmacyId"],
    where: { retailPharmacyId: { in: ids }, isCredit: true },
    _sum: { totalAmount: true },
    _count: { _all: true },
  });

  // Total credit payments made per pharmacy
  const creditPayments = await prisma.creditPayment.groupBy({
    by: ["retailPharmacyId"],
    where: { retailPharmacyId: { in: ids } },
    _sum: { amount: true },
  });

  const orderMap = new Map(creditOrders.map((r) => [r.retailPharmacyId, r]));
  const paymentMap = new Map(creditPayments.map((r) => [r.retailPharmacyId, r]));

  const data = pharmacies
    .map((p) => {
      const ordered = Number(orderMap.get(p.id)?._sum.totalAmount ?? 0);
      const paid = Number(paymentMap.get(p.id)?._sum.amount ?? 0);
      const outstanding = Math.max(0, ordered - paid);
      const creditOrderCount = orderMap.get(p.id)?._count._all ?? 0;
      return { ...p, totalCreditOrdered: ordered, totalPaid: paid, outstanding, creditOrderCount };
    })
    .sort((a, b) => b.outstanding - a.outstanding);

  return NextResponse.json({ success: true, data });
}
