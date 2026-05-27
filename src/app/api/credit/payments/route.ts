import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  retailPharmacyId: z.string().min(1),
  amount: z.number().positive(),
  method: z.enum(["cash", "mobile_money", "bank_transfer"]),
  note: z.string().optional(),
});

/** POST: record a credit payment from a pharmacy. */
export async function POST(req: NextRequest) {
  const session = await auth();
  if ((session?.user?.role !== "wholesale_admin" && session?.user?.role !== "manager")) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body: unknown = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { retailPharmacyId, amount, method, note } = parsed.data;

  // Guard: pharmacy must exist
  const pharmacy = await prisma.user.findUnique({
    where: { id: retailPharmacyId, role: "retail_pharmacy" },
    select: { id: true },
  });
  if (!pharmacy) {
    return NextResponse.json({ success: false, error: "Pharmacy not found" }, { status: 404 });
  }

  const payment = await prisma.creditPayment.create({
    data: {
      retailPharmacyId,
      amount,
      method,
      note: note ?? null,
      recordedById: session.user.id,
    },
  });

  return NextResponse.json({ success: true, data: payment }, { status: 201 });
}
