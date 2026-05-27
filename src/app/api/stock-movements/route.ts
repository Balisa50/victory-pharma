import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "wholesale_admin" && role !== "manager") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const productId = searchParams.get("productId");
  const actionType = searchParams.get("actionType");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(200, Number(searchParams.get("limit") ?? "50"));

  const where = {
    ...(productId ? { productId } : {}),
    ...(actionType
      ? { actionType: actionType as "STOCK_ADD" | "STOCK_TRANSFER" | "ORDER_DEDUCTION" | "ORDER_VOID" | "MANUAL_ADJUST" }
      : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: { product: { select: { id: true, name: true, category: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: { movements, total, pages: Math.ceil(total / limit) },
  });
}
