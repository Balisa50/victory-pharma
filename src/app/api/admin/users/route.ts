import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { UserRole, UserStatus } from "@prisma/client";

/** GET: list all users for the admin Users management page. */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "wholesale_admin") {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const role = req.nextUrl.searchParams.get("role") as UserRole | null;
  const status = req.nextUrl.searchParams.get("status") as UserStatus | null;
  const search = req.nextUrl.searchParams.get("search")?.trim() ?? "";

  const users = await prisma.user.findMany({
    where: {
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
      ...(search.length >= 2
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { pharmacyName: { contains: search, mode: "insensitive" } },
              { pharmacyId: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      pharmacyName: true,
      pharmacyId: true,
      location: true,
      verifiedAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ success: true, data: users });
}
