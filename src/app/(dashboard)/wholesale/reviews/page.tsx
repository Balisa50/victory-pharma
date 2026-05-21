"use client";

import useSWR from "swr";
import { Star } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableRowSkeleton } from "@/components/shared/LoadingSkeleton";
import type { Review } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((d) => d.data);

type ReviewsData = {
  reviews: (Review & {
    retailPharmacy: { name: string; pharmacyName: string | null };
    order: { id: string; createdAt: Date };
  })[];
  averageRating: number;
};

export default function WholesaleReviewsPage() {
  const { data, isLoading } = useSWR<ReviewsData>("/api/reviews", fetcher);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
        {data && (
          <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold text-yellow-800">
              {data.averageRating.toFixed(1)} average
            </span>
            <span className="text-sm text-yellow-600">({data.reviews.length} reviews)</span>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase text-gray-400">
                <th className="px-4 py-3">Pharmacy</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Comment</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)
              ) : (data?.reviews?.length ?? 0) === 0 ? (
                <tr><td colSpan={5}><EmptyState message="No reviews yet" /></td></tr>
              ) : (
                data!.reviews.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {r.retailPharmacy.pharmacyName ?? r.retailPharmacy.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">#{r.orderId.slice(-8)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.comment ?? "No comment"}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(r.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
