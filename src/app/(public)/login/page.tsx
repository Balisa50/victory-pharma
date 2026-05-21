"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pill, Loader2 } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    setLoading(true);
    try {
      const result = await signIn("credentials", { ...data, redirect: false });
      if (result?.error) {
        toast.error("Invalid email or password");
      } else {
        router.refresh();
        router.push("/");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <span aria-hidden className="pointer-events-none absolute -left-40 -top-32 h-96 w-96 rounded-full bg-[hsl(var(--navy-3))]/15 blur-[120px]" />
      <span aria-hidden className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-[hsl(var(--gold))]/15 blur-[120px]" />

      <div className="relative w-full max-w-md rounded-2xl bg-white p-9 shadow-[0_20px_60px_rgba(13,31,78,0.08)] ring-1 ring-[hsl(var(--navy))]/5">
        <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-[hsl(var(--gold))]" />

        <div className="mb-8 flex flex-col items-center gap-3">
          <Link href="/" className="grid h-12 w-12 place-items-center rounded-full bg-[hsl(var(--navy))] ring-2 ring-[hsl(var(--gold))]/40">
            <Pill className="h-5 w-5 text-[hsl(var(--gold))]" />
          </Link>
          <p className="eyebrow text-[hsl(var(--red-2))]">Member sign in</p>
          <h1 className="display text-[28px] text-[hsl(var(--navy))]">
            Welcome <em>back</em>.
          </h1>
          <p className="text-center text-[13.5px] font-light leading-relaxed text-neutral-500">
            Sign in to your Victory Pharmaceutical account.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-600">
              Email
            </label>
            <input
              {...register("email")}
              type="email"
              autoComplete="email"
              className="w-full rounded-lg border border-neutral-200 bg-[hsl(var(--offwhite))] px-3.5 py-2.5 text-sm transition-colors focus:border-[hsl(var(--gold))] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--gold))]/20"
              placeholder="you@pharmacy.com"
            />
            {errors.email && <p className="mt-1 text-xs text-[hsl(var(--red))]">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-600">
              Password
            </label>
            <input
              {...register("password")}
              type="password"
              autoComplete="current-password"
              className="w-full rounded-lg border border-neutral-200 bg-[hsl(var(--offwhite))] px-3.5 py-2.5 text-sm transition-colors focus:border-[hsl(var(--gold))] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--gold))]/20"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-[hsl(var(--red))]">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[hsl(var(--red))] py-3 text-sm font-semibold tracking-wide text-white transition-all hover:bg-[hsl(var(--red))]/90 hover:-translate-y-px disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign in
          </button>
        </form>

        <p className="mt-7 text-center text-[13px] text-neutral-500">
          No account?{" "}
          <Link href="/register" className="font-semibold text-[hsl(var(--navy))] underline-offset-4 hover:underline">
            Register your pharmacy
          </Link>
        </p>
      </div>
    </div>
  );
}
