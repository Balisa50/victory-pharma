import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await prisma.newsPost.findUnique({
    where: { slug },
    select: { title: true, excerpt: true, published: true },
  });
  if (!post || !post.published) return { title: "News" };
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
  };
}

export default async function NewsPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await prisma.newsPost.findUnique({ where: { slug } });
  if (!post || !post.published) notFound();

  return (
    <main className="min-h-screen bg-[hsl(var(--offwhite))]">
      <article className="mx-auto max-w-[760px] px-6 py-14 md:py-20">
        <Link
          href="/news"
          className="mb-6 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-neutral-500 hover:text-[hsl(var(--navy))]"
        >
          <ArrowLeft className="h-4 w-4" />
          All posts
        </Link>

        <p className="eyebrow mb-3 text-[hsl(var(--red-2))]">
          {formatDate(post.publishedAt ?? post.createdAt)}
        </p>
        <h1
          className="display mb-6 text-[hsl(var(--navy))]"
          style={{ fontSize: "clamp(34px, 4.6vw, 52px)" }}
        >
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="serif mb-8 text-[18px] leading-relaxed text-neutral-600">
            {post.excerpt}
          </p>
        )}

        {post.coverImage && (
          <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-2xl bg-[hsl(var(--navy))]/5 ring-1 ring-[hsl(var(--navy))]/5">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              sizes="760px"
              priority
              className="object-cover"
            />
          </div>
        )}

        <div className="prose-victory whitespace-pre-wrap text-[16px] leading-[1.85] text-neutral-700">
          {post.body}
        </div>
      </article>
    </main>
  );
}
