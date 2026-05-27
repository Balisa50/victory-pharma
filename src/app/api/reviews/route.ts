import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createReviewSchema } from "@/lib/validation/review";
import { sanitizeText } from "@/lib/utils/sanitize";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if ((session?.user?.role !== "wholesale_admin" && session?.user?.role !== "manager")) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const reviews = await prisma.review.findMany({
    include: { retailPharmacy: { select: { name: true, pharmacyName: true } }, order: { select: { id: true, createdAt: true } } },
    orderBy: { createdAt: "desc" },
  });

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return NextResponse.json({ success: true, data: { reviews, averageRating } });
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
  const parsed = createReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const order = await prisma.order.findUnique({
    where: { id: parsed.data.orderId },
    include: { review: true },
  });

  if (!order) return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
  if (order.retailPharmacyId !== session.user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  if (order.status !== "delivered") {
    return NextResponse.json({ success: false, error: "Can only review delivered orders" }, { status: 400 });
  }
  if (order.review) {
    return NextResponse.json({ success: false, error: "Review already submitted" }, { status: 409 });
  }

  const review = await prisma.review.create({
    data: {
      orderId: parsed.data.orderId,
      retailPharmacyId: session.user.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment ? sanitizeText(parsed.data.comment) : null,
    },
  });

  return NextResponse.json({ success: true, data: review }, { status: 201 });
}
