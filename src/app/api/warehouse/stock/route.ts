import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  addStockSchema,
  adjustStockSchema,
  transferStockSchema,
} from "@/lib/validation/warehouse";
import { addStock, adjustStock, transferStock } from "@/lib/warehouse/stockService";
import { unitsForPack } from "@/lib/packaging";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "wholesale_admin") return null;
  return session;
}

/** GET: warehouse stock for every product + the recent movement log. */
export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const [products, movements] = await Promise.all([
    prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    }),
    prisma.stockMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
      include: { product: { select: { name: true } } },
    }),
  ]);

  return NextResponse.json({ success: true, data: { products, movements } });
}

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("add") }).merge(addStockSchema),
  z.object({ action: z.literal("adjust") }).merge(adjustStockSchema),
  z.object({ action: z.literal("transfer") }).merge(transferStockSchema),
]);

/** POST: add (warehouse), transfer (warehouse→sales), or adjust stock. */
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body: unknown = await req.json();
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 422 }
    );
  }

  try {
    if (parsed.data.action === "add") {
      const { productId, cartons, bottles, units, note } = parsed.data;
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { unitsPerBottle: true, bottlesPerCarton: true },
      });
      if (!product) {
        return NextResponse.json(
          { success: false, error: "Product not found" },
          { status: 404 }
        );
      }
      const baseUnits =
        cartons * unitsForPack(product, "carton") +
        bottles * unitsForPack(product, "bottle") +
        units;
      const updated = await addStock({
        productId,
        baseUnits,
        adminId: session.user.id,
        note: note ?? null,
      });
      return NextResponse.json({ success: true, data: updated });
    }

    if (parsed.data.action === "transfer") {
      const { productId, cartons, bottles, units, note } = parsed.data;
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { unitsPerBottle: true, bottlesPerCarton: true },
      });
      if (!product) {
        return NextResponse.json(
          { success: false, error: "Product not found" },
          { status: 404 }
        );
      }
      const baseUnits =
        cartons * unitsForPack(product, "carton") +
        bottles * unitsForPack(product, "bottle") +
        units;
      const updated = await transferStock({
        productId,
        baseUnits,
        adminId: session.user.id,
        note: note ?? null,
      });
      return NextResponse.json({ success: true, data: updated });
    }

    // action === "adjust"
    const { productId, adjustment, reason } = parsed.data;
    const updated = await adjustStock({
      productId,
      adjustment,
      reason,
      adminId: session.user.id,
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stock operation failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
