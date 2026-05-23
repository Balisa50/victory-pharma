"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { PageHeader, PageBody, Panel } from "@/components/shared/Editorial";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { NewsModal, type NewsRow } from "./components/NewsModal";

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((d) => d.data as NewsRow[]);

export default function AdminNewsPage() {
  const { data, isLoading, mutate } = useSWR(
    "/api/news?adminView=true",
    fetcher,
    { refreshInterval: 30000 }
  );
  const [editing, setEditing] = useState<NewsRow | null>(null);
  const [creating, setCreating] = useState(false);

  async function openForEdit(slug: string) {
    // Fetch the full post (with body) before opening the modal.
    const res = await fetch(`/api/news/${slug}`);
    const json = (await res.json()) as { success: boolean; data?: NewsRow };
    if (json.success && json.data) setEditing(json.data);
  }

  async function handleDelete(slug: string) {
    const res = await fetch(`/api/news/${slug}`, { method: "DELETE" });
    const json = (await res.json()) as { success: boolean; error?: string };
    if (json.success) {
      toast.success("Post removed");
      mutate();
    } else {
      toast.error(json.error ?? "Failed to remove");
    }
  }

  const rows = data ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Editorial"
        title="News &"
        accent="media"
        description="Posts written here appear on the public /news page in real time."
        action={
          <button onClick={() => setCreating(true)} className="btn btn-red">
            <Plus className="h-4 w-4" />
            New post
          </button>
        }
      />

      <PageBody>
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="ed-thead">
                  <th className="px-6 py-3.5 md:px-7">Title</th>
                  <th className="px-4 py-3.5">Slug</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Updated</th>
                  <th className="px-6 py-3.5 text-right md:px-7">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-neutral-100">
                      <td colSpan={5} className="h-14 animate-pulse bg-neutral-50/60" />
                    </tr>
                  ))
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState message="No posts yet. Write your first one." />
                    </td>
                  </tr>
                ) : (
                  rows.map((p) => (
                    <tr key={p.id} className="ed-row">
                      <td className="px-6 py-4 md:px-7">
                        <p className="serif italic text-[hsl(var(--navy))]">
                          {p.title}
                        </p>
                        {p.excerpt && (
                          <p className="mt-0.5 line-clamp-1 text-[12px] text-neutral-500">
                            {p.excerpt}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 font-mono text-[11.5px] text-neutral-400">
                        {p.slug}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                            p.published
                              ? "bg-[hsl(var(--green))]/12 text-[hsl(var(--green))]"
                              : "bg-neutral-100 text-neutral-500"
                          }`}
                        >
                          {p.published ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-[12px] text-neutral-400">
                        {formatDate(
                          (p as NewsRow & { updatedAt?: string }).updatedAt ?? new Date()
                        )}
                      </td>
                      <td className="px-6 py-4 md:px-7">
                        <div className="flex items-center justify-end gap-1.5">
                          {p.published && (
                            <Link
                              href={`/news/${p.slug}`}
                              target="_blank"
                              className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-[hsl(var(--navy))]/8 hover:text-[hsl(var(--navy))]"
                              aria-label="View"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          )}
                          <button
                            onClick={() => openForEdit(p.slug)}
                            className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-[hsl(var(--navy))]/8 hover:text-[hsl(var(--navy))]"
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <ConfirmDialog
                            trigger={
                              <button
                                className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-[hsl(var(--red))]/10 hover:text-[hsl(var(--red))]"
                                aria-label="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            }
                            title="Delete post"
                            description={`Delete "${p.title}"? This cannot be undone.`}
                            confirmLabel="Delete"
                            destructive
                            onConfirm={() => handleDelete(p.slug)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </PageBody>

      {(creating || editing) && (
        <NewsModal
          post={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            mutate();
          }}
        />
      )}
    </>
  );
}
