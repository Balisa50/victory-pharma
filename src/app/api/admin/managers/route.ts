import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(6, "Phone is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

/** POST: admin creates a manager account (auto-active). */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "wholesale_admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body: unknown = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return NextResponse.json(
      { success: false, error: "Email already registered" },
      { status: 409 }
    );
  }

  const hashed = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      password: hashed,
      role: "manager",
      status: "active",
      verifiedAt: new Date(),
      approvedBy: session.user.id,
    },
    select: { id: true, name: true, email: true, role: true, status: true },
  });

  return NextResponse.json({ success: true, data: user }, { status: 201 });
}
