"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, ImagePlus, X } from "lucide-react";
import {
  createNewsSchema,
  slugify,
  type CreateNewsInput,
} from "@/lib/validation/news";
import { Modal } from "@/components/shared/Editorial";

export type NewsRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body?: string;
  coverImage: string | null;
  published: boolean;
};

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export function NewsModal({
  post,
  onClose,
  onSaved,
}: {
  post: NewsRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateNewsInput>({
    resolver: zodResolver(createNewsSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      body: "",
      coverImage: null,
      published: false,
    },
  });

  const coverImage = watch("coverImage");

  useEffect(() => {
    if (post) {
      reset({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? "",
        body: post.body ?? "",
        coverImage: post.coverImage,
        published: post.published,
      });
    }
  }, [post, reset]);

  async function handleFile(file: File) {
    if (!ALLOWED.includes(file.type)) {
      toast.error("Only JPG, PNG or WebP images are allowed");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be under 4 MB");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const json = (await res.json()) as {
        success: boolean;
        data?: { url: string };
        error?: string;
      };
      if (json.success && json.data) {
        setValue("coverImage", json.data.url, { shouldValidate: true });
        toast.success("Image uploaded");
      } else {
        toast.error(json.error ?? "Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(data: CreateNewsInput) {
    setSaving(true);
    try {
      const url = post ? `/api/news/${post.slug}` : "/api/news";
      const method = post ? "PATCH" : "POST";
      const payload = {
        ...data,
        coverImage: data.coverImage || null,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (json.success) {
        toast.success(post ? "Post updated" : "Post created");
        onSaved();
      } else {
        toast.error(json.error ?? "Failed to save");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      eyebrow={post ? "Editing" : "New post"}
      title={post ? "Edit" : "Write a"}
      accent={post ? "post" : "post"}
      onClose={onClose}
      maxWidth="max-w-2xl"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-h-[78vh] space-y-4 overflow-y-auto px-6 py-6"
      >
        <div>
          <label className="field-label">Title</label>
          <input
            {...register("title")}
            onBlur={(e) => {
              if (!post && !watch("slug")) {
                setValue("slug", slugify(e.target.value), {
                  shouldValidate: true,
                });
              }
            }}
            className="field text-[16px]"
            placeholder="A clear, scannable headline"
          />
          {errors.title && <p className="field-error">{errors.title.message}</p>}
        </div>

        <div>
          <label className="field-label">Slug</label>
          <input
            {...register("slug")}
            className="field font-mono"
            placeholder="lowercase-with-dashes"
          />
          {errors.slug && <p className="field-error">{errors.slug.message}</p>}
        </div>

        <div>
          <label className="field-label">Excerpt (optional)</label>
          <textarea
            {...register("excerpt")}
            rows={2}
            className="field"
            placeholder="One- or two-line summary for the listing page"
          />
          {errors.excerpt && (
            <p className="field-error">{errors.excerpt.message}</p>
          )}
        </div>

        <div>
          <label className="field-label">Body</label>
          <textarea
            {...register("body")}
            rows={10}
            className="field font-mono text-[13.5px]"
            placeholder="Write the article. Blank lines create paragraphs."
          />
          {errors.body && <p className="field-error">{errors.body.message}</p>}
        </div>

        {/* Cover image */}
        <div>
          <label className="field-label">Cover image (optional)</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          {coverImage ? (
            <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-[hsl(var(--offwhite))] p-2">
              <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md bg-white">
                <Image
                  src={coverImage}
                  alt="Cover"
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <span className="flex-1 truncate text-[12.5px] text-neutral-500">
                Cover attached
              </span>
              <button
                type="button"
                onClick={() => setValue("coverImage", null)}
                className="grid h-7 w-7 place-items-center rounded-full bg-[hsl(var(--navy))] text-white transition-colors hover:bg-[hsl(var(--red))]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex w-full items-center gap-3 rounded-lg border border-dashed border-neutral-300 bg-[hsl(var(--offwhite))] px-3.5 py-2.5 text-left text-neutral-500 transition-colors hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--navy))] disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4 shrink-0" />
              )}
              <span className="text-[12.5px] font-medium">
                {uploading ? "Uploading..." : "Upload a cover image"}
              </span>
              <span className="ml-auto text-[11px] text-neutral-400">
                JPG/PNG/WebP, 4 MB
              </span>
            </button>
          )}
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-neutral-200 bg-[hsl(var(--offwhite))] px-3.5 py-2.5">
          <input
            {...register("published")}
            type="checkbox"
            className="h-4 w-4 rounded border-neutral-300 accent-[hsl(var(--red))]"
          />
          <span className="text-[13px] font-medium text-[hsl(var(--navy))]">
            Published — visible on the public news page
          </span>
        </label>

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || uploading}
            className="btn btn-red"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {post ? "Save changes" : "Create post"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
