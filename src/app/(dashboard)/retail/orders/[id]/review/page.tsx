"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import { toast } from "sonner";
import { Star, ArrowLeft, Loader2 } from "lucide-react";
import type { OrderWithRelations } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((d) => d.data);

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: order, isLoading } = useSWR<OrderWithRelations>(`/api/orders/${id}`, fetcher);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  if (isLoading) return <div className="p-6 text-gray-400">Loading...</div>;

  if (!order) return <div className="p-6 text-gray-500">Order not found.</div>;

  if (order.status !== "delivered") {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">Reviews are only available for delivered orders.</p>
        <Link href={`/retail/orders/${id}`} className="text-sm text-blue-600 hover:underline">Back to order</Link>
      </div>
    );
  }

  if (order.review) {
    router.push(`/retail/orders/${id}`);
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { toast.error("Please select a rating"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id, rating, comment: comment || undefined }),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (json.success) {
        toast.success("Review submitted!");
        router.push(`/retail/orders/${id}`);
      } else {
        toast.error(json.error ?? "Failed to submit review");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <Link href={`/retail/orders/${id}`} className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="h-4 w-4" /> Back to order
      </Link>

      <div className="max-w-lg rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-xl font-bold text-gray-900">Leave a Review</h1>
        <p className="mb-6 text-sm text-gray-500">Order #{id.slice(-8)}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-3 block text-sm font-medium text-gray-700">Rating</label>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i + 1)}
                  onMouseEnter={() => setHover(i + 1)}
                  onMouseLeave={() => setHover(0)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      i < (hover || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-200 hover:text-yellow-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Comment <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Share your experience..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading || rating === 0}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-500 py-2.5 font-medium text-white hover:bg-yellow-600 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit Review
          </button>
        </form>
      </div>
    </div>
  );
}
