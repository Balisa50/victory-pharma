import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** GET: full account statement for one retail pharmacy. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if ((session?.user?.role !== "wholesale_admin" && session?.user?.role !== "manager")) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const pharmacy = await prisma.user.findUnique({
    where: { id: id, role: "retail_pharmacy" },
    select: {
      id: true,
      name: true,
      pharmacyName: true,
      phone: true,
      email: true,
      location: true,
      createdAt: true,
    },
  });

  if (!pharmacy) {
    return NextResponse.json({ success: false, error: "Pharmacy not found" }, { status: 404 });
  }

  const [creditOrders, creditPayments] = await Promise.all([
    prisma.order.findMany({
      where: { retailPharmacyId: id, isCredit: true },
      include: { orderItems: true, receipt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.creditPayment.findMany({
      where: { retailPharmacyId: id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalCreditOrdered = creditOrders.reduce(
    (s, o) => s + Number(o.totalAmount),
    0
  );
  const totalPaid = creditPayments.reduce((s, p) => s + Number(p.amount), 0);
  const outstanding = Math.max(0, totalCreditOrdered - totalPaid);

  return NextResponse.json({
    success: true,
    data: { pharmacy, creditOrders, creditPayments, totalCreditOrdered, totalPaid, outstanding },
  });
}
