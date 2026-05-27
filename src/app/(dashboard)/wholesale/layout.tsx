import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { WholesaleSidebar } from "@/components/wholesale/WholesaleSidebar";

export default async function WholesaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Authoritative gate: the admin area is verified against the DATABASE on
  // every render — the session token is never trusted on its own. Only a
  // real, active wholesale_admin account can render anything under /wholesale.
  const account = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, status: true },
  });
  if ((account?.role !== "wholesale_admin" && account?.role !== "manager") || account.status !== "active") {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <WholesaleSidebar />
      <main className="flex-1 overflow-y-auto bg-[hsl(var(--offwhite))] pb-16 md:pb-0">
        {children}
      </main>
    </div>
  );
}
