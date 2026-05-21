"use client";

import useSWR from "swr";
import { Star } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader, PageBody, Panel } from "@/components/shared/Editorial";
import type { Review } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((d) => d.data);

type ReviewsData = {
  reviews: (Review & {
    retailPharmacy: { name: string; pharmacyName: string | null };
    order: { id: string; createdAt: Date };
  })[];
  averageRating: number;
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating
              ? "fill-[hsl(var(--gold))] text-[hsl(var(--gold))]"
              : "text-neutral-200"
          }`}
        />
      ))}
    </div>
  );
}

export default function WholesaleReviewsPage() {
  const { data, isLoading } = useSWR<ReviewsData>("/api/reviews", fetcher);

  return (
    <>
      <PageHeader
        eyebrow="Partner feedback"
        title="What pharmacies"
        accent="say"
        description="Ratings and comments left by retail partners after delivery."
        action={
          data ? (
            <div className="flex items-center gap-2.5 rounded-xl bg-[hsl(var(--navy))] px-4 py-2.5 text-white">
              <Star className="h-4 w-4 fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" />
              <span
                className="display text-white"
                style={{ fontSize: "20px" }}
              >
                {data.averageRating.toFixed(1)}
              </span>
              <span className="text-[11px] uppercase tracking-[0.14em] text-white/55">
                {data.reviews.length} review
                {data.reviews.length !== 1 ? "s" : ""}
              </span>
            </div>
          ) : undefined
        }
      />

      <PageBody>
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="ed-thead">
                  <th className="px-6 py-3.5 md:px-7">Pharmacy</th>
                  <th className="px-4 py-3.5">Order</th>
                  <th className="px-4 py-3.5">Rating</th>
                  <th className="px-4 py-3.5">Comment</th>
                  <th className="px-6 py-3.5 text-right md:px-7">Date</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-neutral-100">
                      <td colSpan={5} className="h-14 animate-pulse bg-neutral-50/60" />
                    </tr>
                  ))
                ) : (data?.reviews?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState message="No reviews yet. They appear once partners rate a delivered order." />
                    </td>
                  </tr>
                ) : (
                  data!.reviews.map((r) => (
                    <tr key={r.id} className="ed-row">
                      <td className="px-6 py-4 md:px-7">
                        <span className="serif italic text-[hsl(var(--navy))]">
                          {r.retailPharmacy.pharmacyName ?? r.retailPharmacy.name}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-mono text-[11.5px] tracking-wide text-neutral-400">
                        #{r.orderId.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-4 py-4">
                        <Stars rating={r.rating} />
                      </td>
                      <td className="max-w-sm px-4 py-4 text-neutral-600">
                        {r.comment ?? (
                          <span className="text-neutral-300">No comment</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-[12px] text-neutral-400 md:px-7">
                        {formatDate(r.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </PageBody>
    </>
  );
}
