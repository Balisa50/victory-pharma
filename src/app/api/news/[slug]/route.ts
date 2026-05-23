import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateNewsSchema } from "@/lib/validation/news";

/** GET: a single post. Drafts are admin-only. */
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const post = await prisma.newsPost.findUnique({
    where: { slug: params.slug },
  });
  if (!post) {
    return NextResponse.json(
      { success: false, error: "Not found" },
      { status: 404 }
    );
  }

  if (!post.published) {
    const session = await auth();
    if (session?.user?.role !== "wholesale_admin") {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 }
      );
    }
  }

  return NextResponse.json({ success: true, data: post });
}

/** PATCH: update a post. Admin only. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth();
  if (session?.user?.role !== "wholesale_admin") {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const body: unknown = await req.json();
  const parsed = updateNewsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Validation failed",
      },
      { status: 422 }
    );
  }

  const existing = await prisma.newsPost.findUnique({
    where: { slug: params.slug },
  });
  if (!existing) {
    return NextResponse.json(
      { success: false, error: "Not found" },
      { status: 404 }
    );
  }

  // Stamp publishedAt the first time a draft is published.
  const becamePublished =
    parsed.data.published === true && !existing.published;

  const post = await prisma.newsPost.update({
    where: { slug: params.slug },
    data: {
      ...parsed.data,
      excerpt: parsed.data.excerpt !== undefined
        ? parsed.data.excerpt || null
        : undefined,
      coverImage: parsed.data.coverImage !== undefined
        ? parsed.data.coverImage || null
        : undefined,
      publishedAt: becamePublished ? new Date() : undefined,
    },
  });

  return NextResponse.json({ success: true, data: post });
}

/** DELETE: remove a post. Admin only. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth();
  if (session?.user?.role !== "wholesale_admin") {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  await prisma.newsPost.delete({ where: { slug: params.slug } });
  return NextResponse.json({ success: true, data: null });
}
