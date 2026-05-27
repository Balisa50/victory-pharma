import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateProductSchema } from "@/lib/validation/product";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const product = await prisma.product.findFirst({
    where: { id: id, deletedAt: null },
  });

  if (!product) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: product });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if ((session?.user?.role !== "wholesale_admin" && session?.user?.role !== "manager")) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body: unknown = await req.json();
  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const product = await prisma.product.update({
    where: { id: id },
    data: {
      ...parsed.data,
      expiryDate: parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : undefined,
    },
  });

  return NextResponse.json({ success: true, data: product });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if ((session?.user?.role !== "wholesale_admin" && session?.user?.role !== "manager")) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  await prisma.product.update({
    where: { id: id },
    data: { deletedAt: new Date(), availabilityStatus: false },
  });

  return NextResponse.json({ success: true, data: null });
}
