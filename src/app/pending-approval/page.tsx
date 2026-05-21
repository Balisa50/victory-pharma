import { redirect } from "next/navigation";
import { Clock, ShieldX, Phone } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SignOutButton } from "@/components/shared/SignOutButton";

export const metadata = { title: "Awaiting approval" };

export default async function PendingApprovalPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      status: true,
      pharmacyName: true,
      name: true,
      rejectionReason: true,
    },
  });

  if (!user) redirect("/login");

  // Approved pharmacies and admins belong in the app, not here.
  if (user.role !== "retail_pharmacy" || user.status === "active") {
    redirect("/");
  }

  const rejected = user.status === "rejected";
  const phone = process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "+220 000 0000";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[hsl(var(--offwhite))] p-4">
      <span
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-32 h-96 w-96 rounded-full bg-[hsl(var(--navy-3))]/15 blur-[120px]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-[hsl(var(--gold))]/15 blur-[120px]"
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_rgba(13,31,78,0.08)] ring-1 ring-[hsl(var(--navy))]/5">
        <div
          className={`h-1 ${
            rejected ? "bg-[hsl(var(--red))]" : "bg-[hsl(var(--gold))]"
          }`}
        />

        <div className="px-9 py-10 text-center">
          <div
            className={`mx-auto mb-6 grid h-14 w-14 place-items-center rounded-full ${
              rejected
                ? "bg-[hsl(var(--red))]/10 text-[hsl(var(--red))]"
                : "bg-[hsl(var(--navy))] text-[hsl(var(--gold))]"
            }`}
          >
            {rejected ? (
              <ShieldX className="h-6 w-6" />
            ) : (
              <Clock className="h-6 w-6" />
            )}
          </div>

          <p className="eyebrow mb-2 text-[hsl(var(--red-2))]">
            {rejected ? "Application declined" : "Verification pending"}
          </p>
          <h1 className="display mb-3 text-[26px] leading-tight text-[hsl(var(--navy))]">
            {rejected ? (
              <>
                We could not <em className="italic text-[hsl(var(--orange))]">approve</em> this account
              </>
            ) : (
              <>
                Your pharmacy is <em className="italic text-[hsl(var(--orange))]">under review</em>
              </>
            )}
          </h1>

          {rejected ? (
            <p className="mb-1 text-[13.5px] font-light leading-relaxed text-neutral-500">
              The registration for{" "}
              <span className="font-medium text-[hsl(var(--navy))]">
                {user.pharmacyName ?? user.name}
              </span>{" "}
              was not approved.
            </p>
          ) : (
            <p className="mb-1 text-[13.5px] font-light leading-relaxed text-neutral-500">
              Thanks for registering{" "}
              <span className="font-medium text-[hsl(var(--navy))]">
                {user.pharmacyName ?? user.name}
              </span>
              . Our team reviews new pharmacy applications within 24 to 48
              hours. You will be able to sign in and order once verified.
            </p>
          )}

          {rejected && user.rejectionReason && (
            <div className="mt-5 rounded-lg border border-[hsl(var(--red))]/20 bg-[hsl(var(--red))]/5 px-4 py-3 text-left">
              <p className="eyebrow mb-1 text-[hsl(var(--red-2))]">Reason</p>
              <p className="text-[13px] leading-relaxed text-neutral-600">
                {user.rejectionReason}
              </p>
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-[hsl(var(--offwhite))] px-4 py-3 text-[12.5px] text-neutral-500">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span>
              Urgent? Call us on{" "}
              <a
                href={`tel:${phone}`}
                className="font-medium text-[hsl(var(--navy))] underline-offset-2 hover:underline"
              >
                {phone}
              </a>
            </span>
          </div>

          <div className="mt-7">
            <SignOutButton className="btn btn-navy w-full" label="Sign out" />
          </div>
        </div>
      </div>
    </main>
  );
}
