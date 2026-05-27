import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const rowSchema = z.object({
  name: z.string().min(1),
  brand: z.string().optional(),
  category: z.string().min(1),
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  quantity: z.number().int().min(0),
  costPrice: z.number().positive().optional(),
  sellingPrice: z.number().positive(),
  barcode: z.string().optional(),
});

const bodySchema = z.object({ rows: z.array(rowSchema) });

/** POST: import validated rows into the products table. */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "wholesale_admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body: unknown = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 422 });
  }

  const { rows } = parsed.data;
  if (rows.length === 0) {
    return NextResponse.json({ success: false, error: "No rows to import" }, { status: 400 });
  }

  const results = await Promise.allSettled(
    rows.map((row) =>
      prisma.product.create({
        data: {
          name: row.name,
          brand: row.brand ?? null,
          category: row.category,
          batchNumber: row.batchNumber ?? null,
          expiryDate: row.expiryDate ? new Date(row.expiryDate) : null,
          stockUnits: row.quantity,
          costPrice: row.costPrice ?? null,
          price: row.sellingPrice,
          barcode: row.barcode ?? null,
          availabilityStatus: row.quantity > 0,
        },
      })
    )
  );

  const imported = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({
    success: true,
    data: { imported, failed, total: rows.length },
  });
}
