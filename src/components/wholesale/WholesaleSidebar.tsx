"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ClipboardList,
  Star,
  MessageSquareWarning,
  Phone,
  Settings,
  Users,
  LogOut,
  Pill,
  ShieldCheck,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/wholesale/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/wholesale/verification", label: "Verification", icon: ShieldCheck },
  { href: "/wholesale/products", label: "Products", icon: Package },
  { href: "/wholesale/warehouse", label: "Warehouse", icon: Warehouse },
  { href: "/wholesale/orders", label: "Orders", icon: ClipboardList },
  { href: "/wholesale/reviews", label: "Reviews", icon: Star },
  { href: "/wholesale/complaints", label: "Complaints", icon: MessageSquareWarning },
  { href: "/wholesale/users", label: "Users", icon: Users },
  { href: "/wholesale/contact", label: "Contact", icon: Phone },
  { href: "/wholesale/settings", label: "Settings", icon: Settings },
];

export function WholesaleSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar: deeper navy with red admin accent */}
      <aside className="hidden w-64 flex-col bg-[#0a1535] text-white md:flex">
        <div className="flex h-[68px] items-center gap-3 border-b-2 border-[hsl(var(--red))] px-6">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-white/10 ring-2 ring-white/15">
            <Pill className="h-4 w-4 text-[hsl(var(--gold))]" />
          </div>
          <span className="serif text-[15px] tracking-wide">
            Victory <span className="text-[hsl(var(--gold))]">Admin</span>
          </span>
        </div>

        <div className="flex items-center gap-2 px-6 py-4">
          <ShieldCheck className="h-3.5 w-3.5 text-[hsl(var(--red-2))]" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[hsl(var(--red-2))]">
            Wholesale console
          </p>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-medium tracking-wide transition-colors",
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/55 hover:bg-white/5 hover:text-white"
                )}
              >
                {active && (
                  <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-[hsl(var(--red))]" />
                )}
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-medium text-white/55 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t-2 border-[hsl(var(--red))] bg-[#0a1535] md:hidden">
        {NAV_ITEMS.slice(0, 5).map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium tracking-wide",
                active ? "text-white" : "text-white/50"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
