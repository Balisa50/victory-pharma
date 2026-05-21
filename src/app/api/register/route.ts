import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validation/auth";
import { rateLimit } from "@/lib/utils/rate-limit";

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req);
  if (limited) return limited;

  const body: unknown = await req.json();
  const parsed = registerSchema.safeParse(body);

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

  const {
    name,
    email,
    phone,
    password,
    pharmacyName,
    location,
    businessRegNumber,
    licenseNumber,
    role,
  } = parsed.data;

  if (role === "wholesale_admin") {
    return NextResponse.json(
      { success: false, error: "Cannot self-register as wholesale admin" },
      { status: 403 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { success: false, error: "Email already registered" },
      { status: 409 }
    );
  }

  const hashed = await bcrypt.hash(password, 12);

  // New pharmacies start `pending` and stay locked out until an admin verifies.
  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      password: hashed,
      pharmacyName,
      location,
      businessRegNumber: businessRegNumber || null,
      licenseNumber: licenseNumber || null,
      role,
      status: "pending",
    },
    select: { id: true, name: true, email: true, role: true, status: true },
  });

  return NextResponse.json({ success: true, data: user }, { status: 201 });
}
