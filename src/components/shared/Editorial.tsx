import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";

/** Back-navigation link with arrow. */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-neutral-500 transition-colors hover:text-[hsl(var(--navy))]"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}

/**
 * Full-bleed editorial page header: eyebrow, serif title with optional
 * italic accent word, optional description, optional action slot and
 * optional back link.
 */
export function PageHeader({
  eyebrow,
  title,
  accent,
  description,
  action,
  back,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  description?: string;
  action?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="border-b border-[hsl(var(--navy))]/10 bg-white">
      <div className="px-6 py-8 md:px-12">
        {back && (
          <div className="mb-4">
            <BackLink href={back.href} label={back.label} />
          </div>
        )}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2 text-[hsl(var(--red-2))]">{eyebrow}</p>
            <h1
              className="display text-[hsl(var(--navy))]"
              style={{ fontSize: "clamp(27px, 3.2vw, 40px)" }}
            >
              {title}{" "}
              {accent && (
                <em className="italic text-[hsl(var(--orange))]">{accent}</em>
              )}
            </h1>
            {description && (
              <p className="mt-2.5 max-w-xl text-[13.5px] font-light leading-relaxed text-neutral-500">
                {description}
              </p>
            )}
          </div>
          {action && (
            <div className="flex flex-wrap items-center gap-2.5">{action}</div>
          )}
        </div>
      </div>
    </header>
  );
}

/** White editorial card with hairline ring and optional titled header. */
export function Panel({
  eyebrow,
  title,
  accent,
  action,
  children,
  className = "",
}: {
  eyebrow?: string;
  title?: string;
  accent?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl bg-white ring-1 ring-[hsl(var(--navy))]/5 ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-6 py-5 md:px-7">
          <div>
            {eyebrow && (
              <p className="eyebrow mb-1 text-[hsl(var(--red-2))]">{eyebrow}</p>
            )}
            {title && (
              <h2 className="serif text-[18px] text-[hsl(var(--navy))]">
                {title}{" "}
                {accent && (
                  <em className="italic text-[hsl(var(--orange))]">{accent}</em>
                )}
              </h2>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** Compact stat tile with a coloured left rail and serif number. */
export function StatTile({
  eyebrow,
  value,
  footnote,
  tone = "navy",
}: {
  eyebrow: string;
  value: string;
  footnote?: string;
  tone?: "navy" | "red" | "gold" | "green";
}) {
  const rail = {
    navy: "bg-[hsl(var(--navy-3))]",
    red: "bg-[hsl(var(--red-2))]",
    gold: "bg-[hsl(var(--gold))]",
    green: "bg-[hsl(var(--green))]",
  }[tone];
  const number = tone === "red" ? "text-[hsl(var(--red-2))]" : "text-[hsl(var(--navy))]";

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-6 ring-1 ring-[hsl(var(--navy))]/5">
      <span className={`absolute inset-y-5 left-0 w-[3px] rounded-r-full ${rail}`} />
      <div className="pl-3">
        <p className="eyebrow mb-2 text-[hsl(var(--red-2))]">{eyebrow}</p>
        <p
          className={`display ${number}`}
          style={{ fontSize: "clamp(28px, 2.4vw, 36px)" }}
        >
          {value}
        </p>
        {footnote && (
          <p className="mt-2.5 text-[12px] font-light leading-relaxed text-neutral-500">
            {footnote}
          </p>
        )}
      </div>
    </div>
  );
}

/** Page body wrapper: editorial off-white field with consistent padding. */
export function PageBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6 px-6 py-7 md:px-12 md:py-8">{children}</div>
  );
}

/**
 * Editorial modal shell: navy scrim, gold accent rail, eyebrow + serif
 * title header with a close control. Body content is passed as children.
 */
export function Modal({
  eyebrow,
  title,
  accent,
  onClose,
  children,
  maxWidth = "max-w-md",
}: {
  eyebrow?: string;
  title: string;
  accent?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[hsl(var(--navy))]/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${maxWidth} overflow-hidden rounded-2xl bg-white shadow-[0_30px_80px_rgba(13,31,78,0.25)]`}
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-[hsl(var(--gold))]" />
        <div className="flex items-start justify-between gap-4 border-b border-neutral-100 px-6 py-5">
          <div>
            {eyebrow && (
              <p className="eyebrow mb-1 text-[hsl(var(--red-2))]">{eyebrow}</p>
            )}
            <h2 className="serif text-[19px] text-[hsl(var(--navy))]">
              {title}{" "}
              {accent && (
                <em className="italic text-[hsl(var(--orange))]">{accent}</em>
              )}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="-mr-1.5 rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-[hsl(var(--offwhite))] hover:text-[hsl(var(--navy))]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
