import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createComplaintSchema } from "@/lib/validation/complaint";
import { sanitizeText } from "@/lib/utils/sanitize";
import { ComplaintStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") as ComplaintStatus | null;

  const isAdmin = (session.user.role === "wholesale_admin" || session.user.role === "manager");

  const complaints = await prisma.complaint.findMany({
    where: {
      ...(isAdmin ? {} : { retailPharmacyId: session.user.id }),
      ...(status ? { status } : {}),
    },
    include: {
      retailPharmacy: { select: { name: true, pharmacyName: true } },
      order: { select: { id: true, createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: complaints });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "retail_pharmacy") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  if (session.user.status !== "active") {
    return NextResponse.json({ success: false, error: "Account not approved" }, { status: 403 });
  }

  const body: unknown = await req.json();
  const parsed = createComplaintSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const order = await prisma.order.findUnique({ where: { id: parsed.data.orderId } });
  if (!order) return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
  if (order.retailPharmacyId !== session.user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  if (["delivered", "cancelled"].includes(order.status)) {
    return NextResponse.json(
      { success: false, error: "Cannot submit complaint for delivered or cancelled orders" },
      { status: 400 }
    );
  }

  const complaint = await prisma.complaint.create({
    data: {
      orderId: parsed.data.orderId,
      retailPharmacyId: session.user.id,
      type: parsed.data.type,
      description: sanitizeText(parsed.data.description),
    },
  });

  return NextResponse.json({ success: true, data: complaint }, { status: 201 });
}
