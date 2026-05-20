import Link from "next/link";
import { Pill, ShieldCheck, TrendingUp, Truck } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-blue-200 bg-white/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-bold text-blue-900">Victory Pharmaceutical</span>
          </div>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="rounded-md px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      <section className="container flex flex-col items-center gap-6 py-24 text-center">
        <div className="rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700">
          Trusted wholesale pharmaceutical supplier
        </div>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-blue-900 sm:text-5xl">
          Order pharmaceutical supplies with confidence
        </h1>
        <p className="max-w-xl text-lg text-gray-600">
          Streamlined ordering, real-time tracking, and transparent payments for retail pharmacies
          across The Gambia.
        </p>
        <div className="flex gap-4">
          <Link
            href="/register"
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-blue-300 px-6 py-3 font-medium text-blue-700 hover:bg-blue-50"
          >
            Sign in
          </Link>
        </div>
      </section>

      <section className="container grid gap-6 pb-24 md:grid-cols-3">
        {[
          {
            icon: ShieldCheck,
            title: "Verified products",
            body: "Every product is quality-checked and expiry-tracked before dispatch.",
          },
          {
            icon: Truck,
            title: "Live delivery tracking",
            body: "Follow your order from confirmation to doorstep with timestamped status updates.",
          },
          {
            icon: TrendingUp,
            title: "Transparent pricing",
            body: "No hidden fees. Pay via cash, mobile money, or bank transfer.",
          },
        ].map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm"
          >
            <Icon className="mb-3 h-8 w-8 text-blue-600" />
            <h3 className="mb-2 font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{body}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-blue-100 bg-white/60 py-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Victory Pharmaceutical. All rights reserved.
      </footer>
    </div>
  );
}
