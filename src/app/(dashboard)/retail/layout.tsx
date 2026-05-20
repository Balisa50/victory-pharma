import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RetailSidebar } from "@/components/retail/RetailSidebar";

export default async function RetailLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "retail_pharmacy") redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden">
      <RetailSidebar pharmacyName={session.user.pharmacyName} />
      <main className="flex-1 overflow-y-auto bg-gray-50 pb-16 md:pb-0">{children}</main>
    </div>
  );
}
