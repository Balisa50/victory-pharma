import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 4 * 1024 * 1024; // 4 MB

/**
 * Uploads a product image to Vercel Blob. Admin-only. Returns the public URL.
 * Degrades cleanly with a 503 if the Blob store is not yet connected.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "wholesale_admin") {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        success: false,
        error: "Image storage is not configured yet.",
      },
      { status: 503 }
    );
  }

  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { success: false, error: "No file provided" },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { success: false, error: "Only JPG, PNG or WebP images are allowed" },
      { status: 415 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { success: false, error: "Image must be under 4 MB" },
      { status: 413 }
    );
  }

  const ext = file.type.split("/")[1];
  const blob = await put(`products/${randomUUID()}.${ext}`, file, {
    access: "public",
    contentType: file.type,
  });

  return NextResponse.json({ success: true, data: { url: blob.url } });
}
