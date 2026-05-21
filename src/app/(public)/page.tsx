import Link from "next/link";
import { Pill, ShieldCheck, TrendingUp, Truck, PackageCheck, Clock, Wallet } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[hsl(var(--offwhite))]">
      {/* ── NAV ── */}
      <nav className="fixed inset-x-0 top-0 z-50 flex h-[68px] items-center justify-between border-b-2 border-[hsl(var(--gold))] bg-[hsl(var(--navy))] px-6 shadow-[0_2px_20px_rgba(0,0,0,0.4)] md:px-10">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-white/10 ring-2 ring-white/15">
            <Pill className="h-5 w-5 text-[hsl(var(--gold))]" />
          </div>
          <span className="serif text-[17px] tracking-wide text-white">
            Victory <span className="text-[hsl(var(--gold))]">Pharmaceutical</span>
          </span>
        </div>
        <div className="hidden items-center gap-1 md:flex">
          <a href="#about" className="rounded-md px-3.5 py-1.5 text-[13px] font-medium tracking-wide text-white/70 transition-colors hover:bg-white/10 hover:text-[hsl(var(--gold))]">
            About
          </a>
          <a href="#how" className="rounded-md px-3.5 py-1.5 text-[13px] font-medium tracking-wide text-white/70 transition-colors hover:bg-white/10 hover:text-[hsl(var(--gold))]">
            How it works
          </a>
          <a href="#partners" className="rounded-md px-3.5 py-1.5 text-[13px] font-medium tracking-wide text-white/70 transition-colors hover:bg-white/10 hover:text-[hsl(var(--gold))]">
            For pharmacies
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative flex min-h-[88vh] flex-col items-center justify-center overflow-hidden bg-[linear-gradient(135deg,_hsl(var(--navy))_0%,_#0a1535_60%,_#1a0a05_100%)] px-6 pb-16 pt-32 text-center md:px-10">
        <span
          aria-hidden
          className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-[hsl(var(--navy-3))]/35 blur-[100px]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-[hsl(var(--red))]/25 blur-[110px]"
        />

        <p className="eyebrow mb-5 text-[hsl(var(--gold))]">Wholesale pharmaceutical partners</p>
        <h1 className="display mb-5 text-white" style={{ fontSize: "clamp(42px, 6vw, 72px)" }}>
          Medicine, <em>delivered</em><br className="hidden md:block" /> with confidence.
        </h1>
        <p className="mb-10 max-w-[560px] text-[18px] font-light leading-[1.7] text-white/55">
          A quieter way to stock your pharmacy: verified products, predictable
          pricing, and a delivery window you can actually trust.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/register" className="btn-primary">
            Open an account
          </Link>
          <Link href="/login" className="btn-outline">
            Sign in
          </Link>
        </div>
      </section>

      {/* ── QUICK ACCESS ── */}
      <div className="flex flex-wrap justify-center border-b-2 border-[hsl(var(--gold))] bg-[hsl(var(--navy-2))] px-6 py-6 md:px-10">
        {[
          { label: "Verified suppliers", href: "#about" },
          { label: "Live delivery tracking", href: "#how" },
          { label: "Transparent pricing", href: "#how" },
          { label: "Partner pharmacies", href: "#partners" },
        ].map((item, i, arr) => (
          <a
            key={item.label}
            href={item.href}
            className={`px-6 py-3 text-[12.5px] font-medium uppercase tracking-[0.1em] text-white/65 transition-colors hover:text-[hsl(var(--gold))] md:px-8 ${
              i < arr.length - 1 ? "md:border-r md:border-white/10" : ""
            }`}
          >
            {item.label}
          </a>
        ))}
      </div>

      {/* ── ABOUT ── */}
      <section id="about" className="bg-[hsl(var(--offwhite))] px-6 py-20 md:px-10 md:py-24">
        <div className="mx-auto max-w-[1100px]">
          <p className="eyebrow mb-2.5 text-[hsl(var(--red-2))]">Why Victory</p>
          <h2 className="display mb-3.5 text-[hsl(var(--navy))]" style={{ fontSize: "clamp(28px, 4vw, 42px)" }}>
            Built for the way <em>real pharmacies</em> order.
          </h2>
          <p className="mb-12 max-w-[640px] text-[16px] font-light leading-[1.7] text-neutral-600">
            Every shelf-keeper, every locum, every owner working a Saturday rush.
            Ordering should take a minute, not an afternoon. Victory streamlines the
            in-between.
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "Verified products",
                body: "Quality-checked and expiry-tracked before anything leaves the warehouse. No surprises at intake.",
              },
              {
                icon: Truck,
                title: "Live delivery tracking",
                body: "Watch your order move from confirmation to doorstep, with timestamps you can hold us to.",
              },
              {
                icon: Wallet,
                title: "Transparent pricing",
                body: "No hidden line items. Settle by cash, mobile money, or bank transfer, whichever fits your day.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="brand-card">
                <Icon className="mb-3.5 h-7 w-7 text-[hsl(var(--navy-3))]" />
                <h3 className="serif mb-2.5 text-[18px] text-[hsl(var(--navy))]">{title}</h3>
                <p className="text-[14px] leading-[1.75] text-neutral-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="bg-white px-6 py-20 md:px-10 md:py-24">
        <div className="mx-auto max-w-[1100px]">
          <p className="eyebrow mb-2.5 text-[hsl(var(--red-2))]">How it works</p>
          <h2 className="display mb-3.5 text-[hsl(var(--navy))]" style={{ fontSize: "clamp(28px, 4vw, 42px)" }}>
            From cart to counter, in <em>three steps</em>.
          </h2>
          <p className="mb-12 max-w-[640px] text-[16px] font-light leading-[1.7] text-neutral-600">
            No portals to memorise, no calls to chase. Just a clean flow your team
            can pick up on day one.
          </p>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                step: "01",
                icon: PackageCheck,
                title: "Browse & order",
                body: "Search by brand, generic, or category. Add to cart in seconds.",
                tone: "blue" as const,
              },
              {
                step: "02",
                icon: Clock,
                title: "Confirm & dispatch",
                body: "We confirm stock in real time and dispatch from the nearest depot.",
                tone: "gold" as const,
              },
              {
                step: "03",
                icon: TrendingUp,
                title: "Receive & reconcile",
                body: "Track on the way, scan on arrival, and reconcile in one click.",
                tone: "dark" as const,
              },
            ].map(({ step, icon: Icon, title, body, tone }) => {
              const bg =
                tone === "blue"
                  ? "bg-[hsl(var(--navy)/0.06)] border border-[hsl(var(--navy-3)/0.2)]"
                  : tone === "gold"
                  ? "bg-[hsl(var(--gold)/0.08)] border border-[hsl(var(--gold)/0.25)]"
                  : "bg-[hsl(var(--navy-3)/0.08)] border border-[hsl(var(--navy-3)/0.18)]";
              return (
                <div key={step} className={`relative overflow-hidden rounded-2xl p-7 ${bg}`}>
                  <span className="serif absolute right-5 top-4 text-[40px] italic text-[hsl(var(--navy)/0.12)]">
                    {step}
                  </span>
                  <Icon className="mb-3.5 h-6 w-6 text-[hsl(var(--navy))]" />
                  <h3 className="mb-2 text-[16px] font-semibold text-[hsl(var(--navy))]">
                    {title}
                  </h3>
                  <p className="text-[13.5px] leading-[1.8] text-neutral-600">{body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PARTNERS CTA (dark band) ── */}
      <section
        id="partners"
        className="px-6 py-20 text-white md:px-10 md:py-24"
        style={{ background: "linear-gradient(135deg, hsl(var(--navy)) 0%, hsl(var(--navy-3)) 100%)" }}
      >
        <div className="mx-auto max-w-[1100px]">
          <p className="eyebrow mb-2.5 text-[hsl(var(--gold))]">For retail pharmacies</p>
          <h2 className="display mb-3.5" style={{ fontSize: "clamp(28px, 4vw, 42px)" }}>
            A wholesale partner that <em>shows up</em>.
          </h2>
          <p className="mb-10 max-w-[640px] text-[16px] font-light leading-[1.7] text-white/55">
            We work with independent pharmacies across The Gambia: small shops,
            chains, and everything in between. Open an account in minutes; start
            ordering today.
          </p>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              { tone: "urgent" as const, title: "Same-day dispatch", body: "Orders placed before 11 AM ship the same day, six days a week.", cta: "Open an account", href: "/register" },
              { tone: "campus" as const, title: "Net-30 for partners", body: "Verified accounts unlock flexible terms after three settled orders.", cta: "Learn more", href: "/register" },
              { tone: "peer" as const, title: "Talk to a human", body: "Real people on WhatsApp and phone, 8 AM to 8 PM, every day.", cta: "Contact us", href: "mailto:hello@victorypharma.com" },
            ].map(({ tone, title, body, cta, href }) => {
              const cardBg =
                tone === "urgent"
                  ? "bg-[hsl(var(--red))]"
                  : tone === "campus"
                  ? "bg-[hsl(var(--navy-3))]"
                  : "bg-[hsl(var(--gold))]";
              const linkBg = tone === "peer" ? "bg-[hsl(var(--navy)/0.15)] text-[hsl(var(--navy))]" : "bg-white/20 text-white";
              const textColor = tone === "peer" ? "text-[hsl(var(--navy))]" : "text-white";
              return (
                <div key={title} className={`rounded-2xl p-7 text-center ${cardBg} ${textColor}`}>
                  <h3 className="mb-2.5 text-[18px] font-bold">{title}</h3>
                  <p className="mb-5 text-[13.5px] leading-[1.7] opacity-85">{body}</p>
                  <Link
                    href={href}
                    className={`inline-block rounded-lg px-5 py-2.5 text-[13px] font-semibold ${linkBg}`}
                  >
                    {cta}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t-[3px] border-[hsl(var(--gold))] bg-[hsl(var(--navy))] px-6 pb-8 pt-12 text-white/60 md:px-10">
        <div className="mx-auto max-w-[1100px]">
          <div className="mb-10 grid gap-10 md:grid-cols-[2fr_1fr_1fr]">
            <div>
              <div className="mb-3.5 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-white/10 ring-2 ring-white/15">
                  <Pill className="h-5 w-5 text-[hsl(var(--gold))]" />
                </div>
                <span className="serif text-[16px] text-white">
                  Victory <span className="text-[hsl(var(--gold))]">Pharmaceutical</span>
                </span>
              </div>
              <p className="max-w-sm text-[13px] leading-[1.8]">
                Wholesale pharmaceuticals for retail partners across The Gambia.
                Stock with confidence.
              </p>
            </div>

            <div>
              <h4 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.13em] text-white">
                Product
              </h4>
              <a href="#about" className="mb-2 block text-[13px] text-white/55 hover:text-[hsl(var(--gold))]">About</a>
              <a href="#how" className="mb-2 block text-[13px] text-white/55 hover:text-[hsl(var(--gold))]">How it works</a>
              <a href="#partners" className="mb-2 block text-[13px] text-white/55 hover:text-[hsl(var(--gold))]">For pharmacies</a>
            </div>

            <div>
              <h4 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.13em] text-white">
                Account
              </h4>
              <Link href="/login" className="mb-2 block text-[13px] text-white/55 hover:text-[hsl(var(--gold))]">Sign in</Link>
              <Link href="/register" className="mb-2 block text-[13px] text-white/55 hover:text-[hsl(var(--gold))]">Register</Link>
              <a href="mailto:hello@victorypharma.com" className="mb-2 block text-[13px] text-white/55 hover:text-[hsl(var(--gold))]">Contact</a>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 text-center text-[12px] tracking-wide text-white/40">
            © {new Date().getFullYear()} Victory Pharmaceutical. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
