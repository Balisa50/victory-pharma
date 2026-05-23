import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createNewsSchema } from "@/lib/validation/news";

/** GET: list news. Admins see drafts too; everyone else only published posts. */
export async function GET(req: NextRequest) {
  const session = await auth();
  const isAdmin = session?.user?.role === "wholesale_admin";
  const adminView =
    isAdmin && req.nextUrl.searchParams.get("adminView") === "true";

  const posts = await prisma.newsPost.findMany({
    where: adminView ? {} : { published: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      coverImage: true,
      published: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ success: true, data: posts });
}

/** POST: create a news post. Admin only. */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "wholesale_admin") {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const body: unknown = await req.json();
  const parsed = createNewsSchema.safeParse(body);
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
    where: { slug: parsed.data.slug },
  });
  if (existing) {
    return NextResponse.json(
      { success: false, error: "A post with that slug already exists" },
      { status: 409 }
    );
  }

  const post = await prisma.newsPost.create({
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      excerpt: parsed.data.excerpt || null,
      body: parsed.data.body,
      coverImage: parsed.data.coverImage || null,
      published: parsed.data.published,
      publishedAt: parsed.data.published ? new Date() : null,
      authorId: session.user.id,
    },
  });

  return NextResponse.json({ success: true, data: post }, { status: 201 });
}
