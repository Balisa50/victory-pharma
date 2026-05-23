import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Newspaper } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "News & Media" };
export const dynamic = "force-dynamic";

export default async function NewsIndexPage() {
  const posts = await prisma.newsPost.findMany({
    where: { published: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      coverImage: true,
      publishedAt: true,
      createdAt: true,
    },
  });

  return (
    <main className="min-h-screen bg-[hsl(var(--offwhite))]">
      {/* Header */}
      <section className="bg-[hsl(var(--navy))] px-6 py-20 text-white md:px-10 md:py-24">
        <div className="mx-auto max-w-[1100px]">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-white/60 hover:text-[hsl(var(--gold))]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <p className="eyebrow mb-3 text-[hsl(var(--gold))]">News & Media</p>
          <h1
            className="display text-white"
            style={{ fontSize: "clamp(38px, 5vw, 60px)" }}
          >
            What's happening at <em className="italic text-[hsl(var(--orange))]">Victory</em>.
          </h1>
          <p className="mt-4 max-w-[640px] text-[16px] font-light leading-relaxed text-white/55">
            Product updates, partner stories, and notes from the warehouse.
          </p>
        </div>
      </section>

      {/* Posts */}
      <section className="px-6 py-16 md:px-10 md:py-20">
        <div className="mx-auto max-w-[1100px]">
          {posts.length === 0 ? (
            <div className="rounded-2xl bg-white py-20 text-center ring-1 ring-[hsl(var(--navy))]/5">
              <Newspaper className="mx-auto mb-3 h-8 w-8 text-[hsl(var(--navy))]/30" />
              <p className="text-[14px] font-light text-neutral-500">
                No posts yet. Check back soon.
              </p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2">
              {posts.map((p) => (
                <Link
                  key={p.id}
                  href={`/news/${p.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-[hsl(var(--navy))]/5 transition-shadow hover:shadow-[0_12px_40px_rgba(13,31,78,0.1)]"
                >
                  {p.coverImage ? (
                    <div className="relative aspect-[16/9] bg-[hsl(var(--offwhite))]">
                      <Image
                        src={p.coverImage}
                        alt={p.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover transition-transform group-hover:scale-[1.02]"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/9] bg-[linear-gradient(135deg,hsl(var(--navy))_0%,hsl(var(--navy-3))_100%)]" />
                  )}
                  <div className="flex flex-1 flex-col p-7">
                    <p className="eyebrow mb-2 text-[hsl(var(--red-2))]">
                      {formatDate(p.publishedAt ?? p.createdAt)}
                    </p>
                    <h2 className="serif mb-3 text-[22px] leading-snug text-[hsl(var(--navy))] group-hover:text-[hsl(var(--orange))]">
                      {p.title}
                    </h2>
                    {p.excerpt && (
                      <p className="text-[14px] font-light leading-relaxed text-neutral-600">
                        {p.excerpt}
                      </p>
                    )}
                    <span className="mt-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--navy))]">
                      Read more →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
