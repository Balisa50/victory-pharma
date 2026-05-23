import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateProfileSchema } from "@/lib/validation/profile";

/** GET: current authenticated user's profile (safe fields only). */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
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
      businessRegNumber: true,
      licenseNumber: true,
      createdAt: true,
      verifiedAt: true,
    },
  });
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not found" },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true, data: user });
}

/** PATCH: pharmacy edits their own profile. Retail only. */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "retail_pharmacy") {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }
  if (session.user.status !== "active") {
    return NextResponse.json(
      { success: false, error: "Account not approved" },
      { status: 403 }
    );
  }

  const body: unknown = await req.json();
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 }
    );
  }

  const data = parsed.data;
  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: data.name,
      phone: data.phone,
      pharmacyName: data.pharmacyName,
      location: data.location,
      businessRegNumber: data.businessRegNumber || null,
      licenseNumber: data.licenseNumber || null,
    },
    select: { id: true, name: true, pharmacyName: true },
  });

  return NextResponse.json({ success: true, data: updated });
}
