import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  Truck,
  Wallet,
  PackageCheck,
  Clock,
  TrendingUp,
  HeartPulse,
  Phone,
  Mail,
} from "lucide-react";
import { getSiteSettings } from "@/lib/settings";

// Pharmacy-green palette, scoped to the landing only.
const GREEN = "#02A554";
const GREEN_DEEP = "#017F40";

export default async function LandingPage() {
  const settings = await getSiteSettings();
  const phone = settings.phonePrimary ?? "+220 000 0000";
  const email = settings.companyEmail;
  const whatsapp = settings.whatsappNumber;
  const address = settings.address;

  return (
    <div className="flex min-h-screen flex-col bg-white text-[hsl(var(--navy))]">
      {/* ── NAV (white, clean) ── */}
      <nav className="fixed inset-x-0 top-0 z-50 flex h-[72px] items-center justify-between border-b border-neutral-100 bg-white/95 px-6 backdrop-blur md:px-10">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.jpg"
            alt="Victory Pharmaceuticals"
            width={44}
            height={44}
            className="h-10 w-10 object-contain"
            priority
          />
          <span className="text-[17px] font-semibold tracking-tight text-[hsl(var(--navy))]">
            Victory <span style={{ color: GREEN }}>Pharmaceuticals</span>
          </span>
        </Link>
        <div className="hidden items-center gap-1 md:flex">
          <a href="#about" className="rounded-md px-3.5 py-1.5 text-[13.5px] font-medium text-neutral-600 transition-colors hover:text-[#02A554]">
            About
          </a>
          <a href="#how" className="rounded-md px-3.5 py-1.5 text-[13.5px] font-medium text-neutral-600 transition-colors hover:text-[#02A554]">
            How it works
          </a>
          <a href="#team" className="rounded-md px-3.5 py-1.5 text-[13.5px] font-medium text-neutral-600 transition-colors hover:text-[#02A554]">
            Our team
          </a>
          <Link href="/news" className="rounded-md px-3.5 py-1.5 text-[13.5px] font-medium text-neutral-600 transition-colors hover:text-[#02A554]">
            News
          </Link>
        </div>
      </nav>

      {/* ── HERO (white with green ambient + the logo) ── */}
      <section className="relative flex min-h-[88vh] items-center overflow-hidden bg-white pt-[72px]">
        <span
          aria-hidden
          className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full opacity-30 blur-[100px]"
          style={{ background: GREEN }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -right-24 bottom-10 h-96 w-96 rounded-full opacity-20 blur-[120px]"
          style={{ background: GREEN_DEEP }}
        />

        <div className="relative mx-auto grid w-full max-w-[1180px] gap-12 px-6 py-16 md:grid-cols-[1.1fr_1fr] md:items-center md:px-10 md:py-24">
          <div>
            <p
              className="mb-4 text-[11px] font-semibold uppercase tracking-[0.32em]"
              style={{ color: GREEN }}
            >
              Wholesale Pharmaceuticals · The Gambia
            </p>
            <h1
              className="display mb-5 text-[hsl(var(--navy))]"
              style={{ fontSize: "clamp(40px, 5.5vw, 68px)", lineHeight: 1.05 }}
            >
              Improving health{" "}
              <em className="italic" style={{ color: GREEN }}>
                in The Gambia
              </em>
              .
            </h1>
            <p className="mb-9 max-w-[520px] text-[17px] font-light leading-[1.7] text-neutral-600">
              Victory Pharmaceuticals supplies verified medicines to pharmacies
              across the country &mdash; with predictable pricing, delivery
              windows you can trust, and a team that picks up the phone.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-lg px-7 py-3.5 text-[13.5px] font-semibold tracking-wide text-white shadow-[0_8px_24px_rgba(2,165,84,0.35)] transition-all hover:-translate-y-px"
                style={{ background: GREEN }}
              >
                Apply as a pharmacy
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg border-2 px-7 py-[13px] text-[13.5px] font-semibold tracking-wide transition-colors hover:bg-[#02A554]/5"
                style={{ borderColor: GREEN, color: GREEN }}
              >
                Sign in
              </Link>
            </div>
          </div>

          {/* Logo showcase */}
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_center,_rgba(2,165,84,0.12)_0%,_transparent_70%)]" />
            <div className="relative mx-auto aspect-square w-full max-w-[440px]">
              <Image
                src="/logo.jpg"
                alt="Victory Pharmaceuticals logo"
                fill
                sizes="(max-width: 768px) 80vw, 440px"
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP (slim, green tinted) ── */}
      <div
        className="border-y border-[#02A554]/15"
        style={{ background: "rgba(2,165,84,0.04)" }}
      >
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-center gap-y-4 px-6 py-5 md:px-10">
          {[
            "Verified medicines",
            "Same-day dispatch",
            "Transparent pricing",
            "Partner pharmacies",
          ].map((label, i, arr) => (
            <span
              key={label}
              className={`px-6 text-[12px] font-medium uppercase tracking-[0.16em] text-neutral-500 md:px-8 ${
                i < arr.length - 1 ? "md:border-r md:border-neutral-200" : ""
              }`}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* ── ABOUT (with storefront photo) ── */}
      <section id="about" className="bg-white px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto grid max-w-[1180px] gap-12 md:grid-cols-2 md:items-center">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-[0_20px_60px_rgba(2,165,84,0.18)]">
            <Image
              src="/team-storefront.jpg"
              alt="The Victory Pharmaceuticals team at the shop"
              fill
              sizes="(max-width: 768px) 100vw, 540px"
              className="object-cover"
            />
            {/* Green corner ribbon */}
            <div
              className="absolute -bottom-1 -left-1 h-24 w-24 rounded-tr-3xl"
              style={{ background: GREEN }}
            />
          </div>
          <div>
            <p
              className="mb-3 text-[11px] font-semibold uppercase tracking-[0.32em]"
              style={{ color: GREEN }}
            >
              Who we are
            </p>
            <h2
              className="display mb-5 text-[hsl(var(--navy))]"
              style={{ fontSize: "clamp(30px, 4vw, 46px)", lineHeight: 1.1 }}
            >
              A Gambian wholesale partner{" "}
              <em className="italic" style={{ color: GREEN }}>
                you can actually rely on
              </em>
              .
            </h2>
            <p className="mb-5 text-[16px] font-light leading-[1.8] text-neutral-600">
              We supply pharmacies the way we&apos;d want our own to be supplied:
              quality-checked stock, honest pricing, and people who answer when
              you call.
            </p>
            <p className="mb-7 text-[16px] font-light leading-[1.8] text-neutral-600">
              Every product passes expiry and quality checks before it leaves
              our warehouse. Every order has a delivery window you can hold us
              to. Every partner gets a real human, not a chatbot.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: ShieldCheck, label: "Quality-checked stock" },
                { icon: HeartPulse, label: "Pharmacist-led team" },
                { icon: Truck, label: "Reliable delivery" },
                { icon: Wallet, label: "Transparent pricing" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <span
                    className="grid h-9 w-9 place-items-center rounded-full"
                    style={{ background: "rgba(2,165,84,0.12)", color: GREEN }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-[14px] font-medium text-[hsl(var(--navy))]">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS (light green field) ── */}
      <section
        id="how"
        className="px-6 py-20 md:px-10 md:py-24"
        style={{ background: "rgba(2,165,84,0.05)" }}
      >
        <div className="mx-auto max-w-[1180px]">
          <p
            className="mb-3 text-[11px] font-semibold uppercase tracking-[0.32em]"
            style={{ color: GREEN }}
          >
            How it works
          </p>
          <h2
            className="display mb-4 text-[hsl(var(--navy))]"
            style={{ fontSize: "clamp(28px, 4vw, 42px)" }}
          >
            From order to{" "}
            <em className="italic" style={{ color: GREEN }}>
              counter
            </em>
            , in three steps.
          </h2>
          <p className="mb-14 max-w-[640px] text-[16px] font-light leading-[1.7] text-neutral-600">
            No portals to memorise, no calls to chase. Just a clean flow your
            team can pick up on day one.
          </p>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                step: "01",
                icon: PackageCheck,
                title: "Browse and order",
                body: "Search by brand, generic or category. Add to cart in seconds, pick unit, bottle or carton.",
              },
              {
                step: "02",
                icon: Clock,
                title: "We confirm and dispatch",
                body: "Stock is verified in real time and dispatched from our warehouse, same day before 11 AM.",
              },
              {
                step: "03",
                icon: TrendingUp,
                title: "You receive and settle",
                body: "Track on the way, scan on arrival, settle by cash, mobile money or bank transfer.",
              },
            ].map(({ step, icon: Icon, title, body }) => (
              <div
                key={step}
                className="relative overflow-hidden rounded-2xl bg-white p-7 shadow-[0_4px_24px_rgba(2,127,64,0.08)]"
              >
                <span
                  className="serif absolute right-5 top-3 text-[44px] italic"
                  style={{ color: "rgba(2,165,84,0.18)" }}
                >
                  {step}
                </span>
                <span
                  className="mb-4 grid h-11 w-11 place-items-center rounded-full"
                  style={{ background: GREEN }}
                >
                  <Icon className="h-5 w-5 text-white" />
                </span>
                <h3 className="serif mb-2 text-[19px] text-[hsl(var(--navy))]">
                  {title}
                </h3>
                <p className="text-[14px] leading-[1.75] text-neutral-600">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM (big group photo, wide format) ── */}
      <section id="team" className="bg-white px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1180px]">
          <div className="mb-12 max-w-[760px]">
            <p
              className="mb-3 text-[11px] font-semibold uppercase tracking-[0.32em]"
              style={{ color: GREEN }}
            >
              The team
            </p>
            <h2
              className="display mb-4 text-[hsl(var(--navy))]"
              style={{ fontSize: "clamp(30px, 4vw, 46px)", lineHeight: 1.1 }}
            >
              Real people, real{" "}
              <em className="italic" style={{ color: GREEN }}>
                pharmacy roots
              </em>
              .
            </h2>
            <p className="text-[16px] font-light leading-[1.8] text-neutral-600">
              The Victory team is led by Gambian pharmacy professionals who
              understand the work behind the counter &mdash; because they have
              done it themselves.
            </p>
          </div>

          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl shadow-[0_24px_64px_rgba(2,127,64,0.18)]">
            <Image
              src="/team-indoor.jpg"
              alt="The Victory Pharmaceuticals team"
              fill
              sizes="(max-width: 1180px) 100vw, 1180px"
              className="object-cover"
            />
          </div>
          <p className="mt-4 text-center text-[12px] uppercase tracking-[0.18em] text-neutral-400">
            The Victory Pharmaceuticals team
          </p>
        </div>
      </section>

      {/* ── PARTNER CTA (deep green band) ── */}
      <section
        id="partners"
        className="relative overflow-hidden px-6 py-20 text-white md:px-10 md:py-24"
        style={{
          background: `linear-gradient(135deg, ${GREEN} 0%, ${GREEN_DEEP} 100%)`,
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-[80px]"
        />
        <div className="relative mx-auto grid max-w-[1180px] gap-10 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-white/70">
              For retail pharmacies
            </p>
            <h2
              className="display mb-5"
              style={{ fontSize: "clamp(28px, 4vw, 42px)", lineHeight: 1.1 }}
            >
              Open a Victory account in{" "}
              <em className="italic text-white/90">a minute</em>.
            </h2>
            <p className="mb-7 max-w-[520px] text-[16px] font-light leading-[1.7] text-white/75">
              Apply online, get verified by our team within 24 to 48 hours,
              start ordering the same day.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg bg-white px-7 py-3.5 text-[13.5px] font-semibold tracking-wide shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-all hover:-translate-y-px"
              style={{ color: GREEN_DEEP }}
            >
              Apply as a pharmacy
            </Link>
          </div>
          <div className="rounded-2xl bg-white/10 p-6 backdrop-blur">
            <p className="eyebrow mb-2 text-white/70">Already a partner?</p>
            <p className="serif mb-4 text-[20px] text-white">Sign in</p>
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-lg border-2 border-white px-6 py-3 text-[13.5px] font-semibold text-white transition-colors hover:bg-white hover:text-[#017F40]"
            >
              Go to your dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER (dark green) ── */}
      <footer
        className="px-6 pb-8 pt-14 text-white/75 md:px-10"
        style={{ background: "#013821" }}
      >
        <div className="mx-auto max-w-[1180px]">
          <div className="mb-10 grid gap-10 md:grid-cols-[2fr_1fr_1fr]">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <Image
                  src="/logo.jpg"
                  alt="Victory Pharmaceuticals"
                  width={44}
                  height={44}
                  className="h-11 w-11 rounded-md bg-white/95 p-1 object-contain"
                />
                <span className="text-[16px] font-semibold text-white">
                  Victory Pharmaceuticals
                </span>
              </div>
              <p className="max-w-sm text-[13.5px] leading-[1.85]">
                Wholesale pharmaceuticals for retail partners across The
                Gambia. Improving health, one shelf at a time.
              </p>
            </div>

            <div>
              <h4 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.18em] text-white">
                Explore
              </h4>
              <a href="#about" className="mb-2 block text-[13px] hover:text-white">About</a>
              <a href="#how" className="mb-2 block text-[13px] hover:text-white">How it works</a>
              <a href="#team" className="mb-2 block text-[13px] hover:text-white">Our team</a>
              <Link href="/news" className="mb-2 block text-[13px] hover:text-white">News</Link>
            </div>

            <div>
              <h4 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.18em] text-white">
                Reach us
              </h4>
              <a
                href={`tel:${phone}`}
                className="mb-2 flex items-center gap-2 text-[13px] hover:text-white"
              >
                <Phone className="h-3.5 w-3.5" />
                {phone}
              </a>
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="mb-2 flex items-center gap-2 text-[13px] hover:text-white"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {email}
                </a>
              )}
              {whatsapp && (
                <a
                  href={whatsapp.startsWith("http") ? whatsapp : `tel:${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-2 block text-[13px] hover:text-white"
                >
                  WhatsApp
                </a>
              )}
              {address && (
                <p className="mt-3 text-[12.5px] leading-[1.7]">{address}</p>
              )}
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 text-center text-[11.5px] tracking-wide text-white/50">
            © {new Date().getFullYear()} Victory Pharmaceuticals. Improving
            health in The Gambia.
          </div>
        </div>
      </footer>
    </div>
  );
}
