import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: id },
    include: {
      orderItems: true,
      payment: true,
      statusHistory: { orderBy: { changedAt: "asc" } },
      review: true,
      complaints: true,
      receipt: true,
      retailPharmacy: { select: { id: true, name: true, pharmacyName: true, phone: true, email: true } },
    },
  });

  if (!order) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  if (session.user.role === "retail_pharmacy" && order.retailPharmacyId !== session.user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ success: true, data: order });
}
