import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** Records a print/reprint of a receipt. */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const receipt = await prisma.receipt.findUnique({
    where: { id: id },
    select: { id: true, retailPharmacyId: true },
  });
  if (!receipt) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }
  if (
    session.user.role === "retail_pharmacy" &&
    receipt.retailPharmacyId !== session.user.id
  ) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.receipt.update({
    where: { id: id },
    data: { printedCount: { increment: 1 }, lastPrintedAt: new Date() },
    select: { printedCount: true, lastPrintedAt: true },
  });

  return NextResponse.json({ success: true, data: updated });
}
