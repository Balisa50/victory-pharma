import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createProductSchema } from "@/lib/validation/product";
import { CATALOG_PAGE_SIZE } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";
  const inStock = searchParams.get("inStock") === "true";
  const sort = searchParams.get("sort") ?? "name_asc";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const adminView = searchParams.get("adminView") === "true";

  const where = {
    deletedAt: null,
    ...(adminView ? {} : { availabilityStatus: true }),
    ...(inStock ? { stockQuantity: { gt: 0 } } : {}),
    ...(search.length >= 2 ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    ...(category ? { category } : {}),
  };

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy:
        sort === "price_asc"
          ? { price: "asc" }
          : sort === "price_desc"
          ? { price: "desc" }
          : { name: "asc" },
      skip: (page - 1) * CATALOG_PAGE_SIZE,
      take: CATALOG_PAGE_SIZE,
    }),
    prisma.product.count({ where }),
    prisma.product.findMany({
      where: { deletedAt: null },
      select: { category: true },
      distinct: ["category"],
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      products,
      total,
      pages: Math.ceil(total / CATALOG_PAGE_SIZE),
      categories: categories.map((c) => c.category),
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "wholesale_admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body: unknown = await req.json();
  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const product = await prisma.product.create({
    data: {
      ...parsed.data,
      expiryDate: parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : null,
    },
  });

  return NextResponse.json({ success: true, data: product }, { status: 201 });
}
