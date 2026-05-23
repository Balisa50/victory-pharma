import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";
import { siteSettingsSchema } from "@/lib/validation/settings";

/** GET: public site settings (contact info shown across the site). */
export async function GET() {
  const settings = await getSiteSettings();
  return NextResponse.json({ success: true, data: settings });
}

/** PATCH: update site settings. Admin only. */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "wholesale_admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body: unknown = await req.json();
  const parsed = siteSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Validation failed",
      },
      { status: 422 }
    );
  }

  // Empty strings are stored as null so fall-backs stay clean.
  const data = Object.fromEntries(
    Object.entries(parsed.data).map(([k, v]) => [k, v ? v : null])
  );

  const updated = await prisma.siteSetting.upsert({
    where: { id: "default" },
    create: { id: "default", ...data },
    update: data,
  });

  return NextResponse.json({ success: true, data: updated });
}
