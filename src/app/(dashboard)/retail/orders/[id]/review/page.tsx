"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { Star, Loader2 } from "lucide-react";
import { PageHeader, PageBody, Panel } from "@/components/shared/Editorial";
import type { OrderWithRelations } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((d) => d.data);

export default function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: order, isLoading } = useSWR<OrderWithRelations>(
    `/api/orders/${id}`,
    fetcher
  );
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  if (isLoading) {
    return (
      <>
        <PageHeader
          eyebrow="Review"
          title="Loading"
          accent="order"
          back={{ href: `/retail/orders/${id}`, label: "Back to order" }}
        />
        <PageBody>
          <div className="h-72 max-w-lg animate-pulse rounded-2xl bg-white" />
        </PageBody>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <PageHeader
          eyebrow="Review"
          title="Order not"
          accent="found"
          back={{ href: "/retail/orders", label: "Back to orders" }}
        />
        <PageBody>
          <Panel>
            <div className="px-7 py-10 text-[13.5px] text-neutral-500">
              This order could not be found.
            </div>
          </Panel>
        </PageBody>
      </>
    );
  }

  if (order.status !== "delivered") {
    return (
      <>
        <PageHeader
          eyebrow="Review"
          title="Not yet"
          accent="available"
          back={{ href: `/retail/orders/${id}`, label: "Back to order" }}
        />
        <PageBody>
          <Panel>
            <div className="px-7 py-10 text-[13.5px] text-neutral-500">
              Reviews can only be left once an order has been delivered.
            </div>
          </Panel>
        </PageBody>
      </>
    );
  }

  if (order.review) {
    router.push(`/retail/orders/${id}`);
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: id,
          rating,
          comment: comment || undefined,
        }),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (json.success) {
        toast.success("Review submitted");
        router.push(`/retail/orders/${id}`);
      } else {
        toast.error(json.error ?? "Failed to submit review");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={`Order #${id.slice(-8).toUpperCase()}`}
        title="Leave a"
        accent="review"
        description="Your feedback helps Victory serve pharmacies better."
        back={{ href: `/retail/orders/${id}`, label: "Back to order" }}
      />

      <PageBody>
        <div className="max-w-lg overflow-hidden rounded-2xl bg-white ring-1 ring-[hsl(var(--navy))]/5">
          <form onSubmit={handleSubmit} className="space-y-7 p-8">
            <div>
              <p className="eyebrow mb-3 text-[hsl(var(--red-2))]">
                How was this order
              </p>
              <div className="flex gap-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i + 1)}
                    onMouseEnter={() => setHover(i + 1)}
                    onMouseLeave={() => setHover(0)}
                    className="focus:outline-none"
                    aria-label={`Rate ${i + 1} stars`}
                  >
                    <Star
                      className={`h-9 w-9 transition-colors ${
                        i < (hover || rating)
                          ? "fill-[hsl(var(--gold))] text-[hsl(var(--gold))]"
                          : "text-neutral-200 hover:text-[hsl(var(--gold))]/40"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-600">
                Comment{" "}
                <span className="font-normal normal-case tracking-normal text-neutral-400">
                  (optional)
                </span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                maxLength={1000}
                placeholder="Share how the order went..."
                className="w-full rounded-lg border border-neutral-200 bg-[hsl(var(--offwhite))] px-3.5 py-2.5 text-sm transition-colors focus:border-[hsl(var(--gold))] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--gold))]/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading || rating === 0}
              className="btn btn-red w-full py-3"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit review
            </button>
          </form>
        </div>
      </PageBody>
    </>
  );
}
