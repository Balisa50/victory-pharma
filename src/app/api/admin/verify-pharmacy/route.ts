import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma, UserStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const verifySchema = z.object({
  userId: z.string().min(1, "User id is required"),
  action: z.enum(["approve", "reject", "reopen"]),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

/** Next sequential pharmacy id (VPH-1001, VPH-1002, ...). */
async function nextPharmacyId(tx: Prisma.TransactionClient): Promise<string> {
  const rows = await tx.user.findMany({
    where: { pharmacyId: { not: null } },
    select: { pharmacyId: true },
  });
  const max = rows.reduce((m, r) => {
    const n = Number(String(r.pharmacyId).replace("VPH-", ""));
    return Number.isFinite(n) && n > m ? n : m;
  }, 1000);
  return `VPH-${max + 1}`;
}

/** GET: list retail pharmacies by verification status. Admin only. */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "wholesale_admin") {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const statusParam = req.nextUrl.searchParams.get("status") ?? "pending";
  if (!["pending", "active", "rejected"].includes(statusParam)) {
    return NextResponse.json(
      { success: false, error: "Invalid status filter" },
      { status: 400 }
    );
  }

  const users = await prisma.user.findMany({
    where: { role: "retail_pharmacy", status: statusParam as UserStatus },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      pharmacyName: true,
      pharmacyId: true,
      location: true,
      businessRegNumber: true,
      licenseNumber: true,
      status: true,
      rejectionReason: true,
      verifiedAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ success: true, data: users });
}

/** POST: approve or reject a pending pharmacy. Admin only. */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "wholesale_admin") {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const body: unknown = await req.json();
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed" },
      { status: 422 }
    );
  }

  const { userId, action, reason } = parsed.data;

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.role !== "retail_pharmacy") {
    return NextResponse.json(
      { success: false, error: "Pharmacy not found" },
      { status: 404 }
    );
  }

  if (action === "approve") {
    const updated = await prisma.$transaction(async (tx) => {
      // Re-use an existing id (e.g. re-opened application), else mint one.
      const pharmacyId = target.pharmacyId ?? (await nextPharmacyId(tx));
      return tx.user.update({
        where: { id: userId },
        data: {
          status: "active",
          approvedBy: session.user.id,
          verifiedAt: new Date(),
          pharmacyId,
          rejectionReason: null,
        },
        select: { id: true, status: true, pharmacyId: true },
      });
    });
    return NextResponse.json({ success: true, data: updated });
  }

  if (action === "reopen") {
    // Move a rejected application back into the pending queue.
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        status: "pending",
        approvedBy: null,
        verifiedAt: null,
        rejectionReason: null,
      },
      select: { id: true, status: true },
    });
    return NextResponse.json({ success: true, data: updated });
  }

  // action === "reject"
  if (!reason || reason.trim().length < 3) {
    return NextResponse.json(
      { success: false, error: "A rejection reason is required" },
      { status: 422 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      status: "rejected",
      approvedBy: session.user.id,
      verifiedAt: new Date(),
      rejectionReason: reason.trim(),
    },
    select: { id: true, status: true },
  });

  return NextResponse.json({ success: true, data: updated });
}
