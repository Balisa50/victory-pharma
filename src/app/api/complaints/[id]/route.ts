import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateComplaintSchema } from "@/lib/validation/complaint";
import { sanitizeText } from "@/lib/utils/sanitize";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if ((session?.user?.role !== "wholesale_admin" && session?.user?.role !== "manager")) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body: unknown = await req.json();
  const parsed = updateComplaintSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Validation failed" }, { status: 422 });
  }

  const complaint = await prisma.complaint.update({
    where: { id: id },
    data: {
      status: parsed.data.status,
      internalNotes: parsed.data.internalNotes ? sanitizeText(parsed.data.internalNotes) : undefined,
    },
  });

  return NextResponse.json({ success: true, data: complaint });
}
