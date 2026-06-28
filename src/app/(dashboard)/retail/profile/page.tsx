"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/lib/validation/profile";
import { formatDate } from "@/lib/utils";
import { PageHeader, PageBody, Panel } from "@/components/shared/Editorial";

type ProfileData = UpdateProfileInput & {
  id: string;
  email: string;
  status: "pending" | "active" | "rejected";
  pharmacyId: string | null;
  createdAt: string;
  verifiedAt: string | null;
};

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((d) => d.data as ProfileData);

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
      {hint && !error && (
        <p className="mt-1 text-[11.5px] text-neutral-400">{hint}</p>
      )}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export default function ProfilePage() {
  const { data, mutate } = useSWR<ProfileData>("/api/profile", fetcher);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
  });

  useEffect(() => {
    if (data) {
      reset({
        name: data.name,
        phone: data.phone,
        pharmacyName: data.pharmacyName ?? "",
        location: data.location ?? "",
        businessRegNumber: data.businessRegNumber ?? "",
        licenseNumber: data.licenseNumber ?? "",
      });
    }
  }, [data, reset]);

  async function onSubmit(values: UpdateProfileInput) {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = (await res.json()) as { success: boolean; error?: string };
    if (json.success) {
      toast.success("Profile updated");
      mutate();
    } else {
      toast.error(json.error ?? "Failed to update profile");
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Pharmacy"
        accent="profile"
        description="Keep contact details up to date so Victory can reach you about orders."
      />

      <PageBody>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-5 lg:grid-cols-[2fr_1fr]"
        >
          <Panel eyebrow="Editable" title="Your" accent="details">
            <div className="grid gap-4 px-6 py-6 md:grid-cols-2 md:px-7">
              <Field label="Owner full name" error={errors.name?.message}>
                <input
                  {...register("name")}
                  className="field"
                  placeholder="Jane Smith"
                />
              </Field>
              <Field label="Phone" error={errors.phone?.message}>
                <input
                  {...register("phone")}
                  type="tel"
                  className="field"
                  placeholder="+220 000 0000"
                />
              </Field>
              <div className="md:col-span-2">
                <Field
                  label="Pharmacy name"
                  error={errors.pharmacyName?.message}
                >
                  <input
                    {...register("pharmacyName")}
                    className="field"
                    placeholder="City Care Pharmacy"
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Location" error={errors.location?.message}>
                  <textarea
                    {...register("location")}
                    rows={2}
                    className="field"
                    placeholder="Street, city, region"
                  />
                </Field>
              </div>
              <Field
                label="Business reg. no."
                error={errors.businessRegNumber?.message}
              >
                <input
                  {...register("businessRegNumber")}
                  className="field"
                  placeholder="Optional"
                />
              </Field>
              <Field
                label="License no."
                error={errors.licenseNumber?.message}
              >
                <input
                  {...register("licenseNumber")}
                  className="field"
                  placeholder="Optional"
                />
              </Field>
            </div>

            <div className="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4 md:px-7">
              <button
                type="submit"
                disabled={isSubmitting || !isDirty || !data}
                className="btn btn-red"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Save changes
              </button>
            </div>
          </Panel>

          {/* Read-only summary */}
          <Panel eyebrow="On file" title="Account">
            <div className="space-y-4 px-6 py-6 text-[13px] md:px-7">
              <div>
                <p className="eyebrow mb-1 text-[hsl(var(--red-2))]">Email</p>
                <p className="text-[hsl(var(--navy))]">
                  {data?.email ?? "-"}
                </p>
                <p className="mt-0.5 text-[11px] text-neutral-400">
                  Email cannot be changed here.
                </p>
              </div>
              <div>
                <p className="eyebrow mb-1 text-[hsl(var(--red-2))]">
                  Pharmacy ID
                </p>
                <p className="font-mono text-[14px] font-medium text-[hsl(var(--navy))]">
                  {data?.pharmacyId ?? "-"}
                </p>
              </div>
              <div>
                <p className="eyebrow mb-1 text-[hsl(var(--red-2))]">Status</p>
                <p className="text-[hsl(var(--green))]">
                  {data?.status === "active"
                    ? "Verified pharmacy"
                    : data?.status ?? "-"}
                </p>
              </div>
              {data?.verifiedAt && (
                <div>
                  <p className="eyebrow mb-1 text-[hsl(var(--red-2))]">
                    Verified
                  </p>
                  <p className="text-neutral-500">
                    {formatDate(data.verifiedAt)}
                  </p>
                </div>
              )}
              {data?.createdAt && (
                <div>
                  <p className="eyebrow mb-1 text-[hsl(var(--red-2))]">
                    Member since
                  </p>
                  <p className="text-neutral-500">
                    {formatDate(data.createdAt)}
                  </p>
                </div>
              )}
            </div>
          </Panel>
        </form>
      </PageBody>
    </>
  );
}
