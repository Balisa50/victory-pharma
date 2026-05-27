import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  category: z.string().min(1).max(60),
  amount: z.number().positive(),
  description: z.string().max(500).optional(),
  date: z.string().optional(), // ISO date string
});

/** GET: list expenses with optional category + date range filters. */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "wholesale_admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category") ?? "";
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where = {
    ...(category ? { category } : {}),
    ...(from || to
      ? {
          date: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to + "T23:59:59Z") } : {}),
          },
        }
      : {}),
  };

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
      take: 200,
    }),
    prisma.expense.aggregate({
      where,
      _sum: { amount: true },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: { expenses, totalAmount: Number(total._sum.amount ?? 0) },
  });
}

/** POST: create an expense. */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "wholesale_admin") {
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

  const expense = await prisma.expense.create({
    data: {
      category: parsed.data.category,
      amount: parsed.data.amount,
      description: parsed.data.description ?? null,
      date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
      recordedById: session.user.id,
    },
  });

  return NextResponse.json({ success: true, data: expense }, { status: 201 });
}
