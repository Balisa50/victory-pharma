"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pill, Loader2, ArrowLeft } from "lucide-react";
import { registerSchema, type RegisterInput } from "@/lib/validation/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "retail_pharmacy" },
  });

  async function onSubmit(data: RegisterInput) {
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (!json.success) {
        toast.error(json.error ?? "Registration failed");
        return;
      }
      toast.success("Application submitted. Awaiting verification.");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    "w-full rounded-lg border border-neutral-200 bg-[hsl(var(--offwhite))] px-3.5 py-2.5 text-sm transition-colors focus:border-[hsl(var(--gold))] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--gold))]/20";
  const labelClass =
    "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-600";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4 py-12">
      <span aria-hidden className="pointer-events-none absolute -left-40 -top-32 h-96 w-96 rounded-full bg-[hsl(var(--navy-3))]/15 blur-[120px]" />
      <span aria-hidden className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-[hsl(var(--gold))]/15 blur-[120px]" />

      <Link
        href="/"
        className="absolute left-5 top-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-500 transition-colors hover:text-[hsl(var(--navy))]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      <div className="relative w-full max-w-md rounded-2xl bg-white p-9 shadow-[0_20px_60px_rgba(13,31,78,0.08)] ring-1 ring-[hsl(var(--navy))]/5">
        <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-[hsl(var(--gold))]" />

        <div className="mb-8 flex flex-col items-center gap-3">
          <Link href="/" className="grid h-12 w-12 place-items-center rounded-full bg-[hsl(var(--navy))] ring-2 ring-[hsl(var(--gold))]/40">
            <Pill className="h-5 w-5 text-[hsl(var(--gold))]" />
          </Link>
          <p className="eyebrow text-[hsl(var(--red-2))]">Open an account</p>
          <h1 className="display text-center text-[26px] leading-[1.15] text-[hsl(var(--navy))]">
            Register your <em>pharmacy</em>.
          </h1>
          <p className="text-center text-[13.5px] font-light leading-relaxed text-neutral-500">
            Applications are verified by our team within 24 to 48 hours.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className={labelClass}>Owner full name</label>
            <input {...register("name")} className={fieldClass} placeholder="Jane Smith" />
            {errors.name && <p className="mt-1 text-xs text-[hsl(var(--red))]">{errors.name.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Pharmacy name</label>
            <input
              {...register("pharmacyName")}
              className={fieldClass}
              placeholder="City Care Pharmacy"
            />
            {errors.pharmacyName && (
              <p className="mt-1 text-xs text-[hsl(var(--red))]">{errors.pharmacyName.message}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>Pharmacy location</label>
            <textarea
              {...register("location")}
              rows={2}
              className={fieldClass}
              placeholder="Street, city, region"
            />
            {errors.location && (
              <p className="mt-1 text-xs text-[hsl(var(--red))]">{errors.location.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Phone</label>
              <input
                {...register("phone")}
                type="tel"
                className={fieldClass}
                placeholder="+220 000 0000"
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-[hsl(var(--red))]">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <input
                {...register("email")}
                type="email"
                className={fieldClass}
                placeholder="you@pharmacy.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-[hsl(var(--red))]">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Business reg. no.</label>
              <input
                {...register("businessRegNumber")}
                className={fieldClass}
                placeholder="Optional"
              />
            </div>

            <div>
              <label className={labelClass}>License no.</label>
              <input
                {...register("licenseNumber")}
                className={fieldClass}
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Password</label>
            <input
              {...register("password")}
              type="password"
              className={fieldClass}
              placeholder="Min 8 chars, 1 uppercase, 1 number"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-[hsl(var(--red))]">{errors.password.message}</p>
            )}
          </div>

          <input type="hidden" {...register("role")} value="retail_pharmacy" />

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[hsl(var(--red))] py-3 text-sm font-semibold tracking-wide text-white transition-all hover:bg-[hsl(var(--red))]/90 hover:-translate-y-px disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit application
          </button>
        </form>

        <p className="mt-7 text-center text-[13px] text-neutral-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[hsl(var(--navy))] underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
