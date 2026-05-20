import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { WholesaleSidebar } from "@/components/wholesale/WholesaleSidebar";

export default async function WholesaleLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "wholesale_admin") redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden">
      <WholesaleSidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50 pb-16 md:pb-0">{children}</main>
    </div>
  );
}
