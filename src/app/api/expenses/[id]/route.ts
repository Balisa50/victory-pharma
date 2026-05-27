import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  category: z.string().min(1).max(60).optional(),
  amount: z.number().positive().optional(),
  description: z.string().max(500).optional(),
  date: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (session?.user?.role !== "wholesale_admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body: unknown = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed" },
      { status: 422 }
    );
  }

  const expense = await prisma.expense.update({
    where: { id: id },
    data: {
      ...(parsed.data.category ? { category: parsed.data.category } : {}),
      ...(parsed.data.amount ? { amount: parsed.data.amount } : {}),
      ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
      ...(parsed.data.date ? { date: new Date(parsed.data.date) } : {}),
    },
  });

  return NextResponse.json({ success: true, data: expense });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (session?.user?.role !== "wholesale_admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  await prisma.expense.delete({ where: { id: id } });
  return NextResponse.json({ success: true });
}
