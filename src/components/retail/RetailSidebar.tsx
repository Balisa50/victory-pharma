"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import {
  LayoutDashboard,
  Search,
  ShoppingCart,
  Package,
  Receipt,
  Phone,
  LogOut,
  Pill,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/retail/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/retail/catalog", label: "Catalog", icon: Search },
  { href: "/retail/cart", label: "Cart", icon: ShoppingCart, showBadge: true },
  { href: "/retail/orders", label: "Orders", icon: Package },
  { href: "/retail/receipts", label: "Receipts", icon: Receipt },
  { href: "/retail/contact", label: "Contact", icon: Phone },
];

export function RetailSidebar({ pharmacyName }: { pharmacyName: string | null }) {
  const pathname = usePathname();
  const { itemCount } = useCart();

  return (
    <>
      {/* Desktop sidebar: navy with gold accents */}
      <aside className="hidden w-64 flex-col border-r border-[hsl(var(--navy))]/10 bg-[hsl(var(--navy))] text-white md:flex">
        <div className="flex h-[68px] items-center gap-3 border-b-2 border-[hsl(var(--gold))] px-6">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-white/10 ring-2 ring-white/15">
            <Pill className="h-4 w-4 text-[hsl(var(--gold))]" />
          </div>
          <span className="serif text-[15px] tracking-wide">
            Victory <span className="text-[hsl(var(--gold))]">Pharma</span>
          </span>
        </div>

        <div className="px-6 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">
            Pharmacy
          </p>
          <p className="mt-1 truncate text-[13px] text-white/85">
            {pharmacyName ?? "Retail Pharmacy"}
          </p>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon, showBadge }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-medium tracking-wide transition-colors",
                  active
                    ? "bg-white/10 text-[hsl(var(--gold))]"
                    : "text-white/65 hover:bg-white/5 hover:text-white"
                )}
              >
                {active && (
                  <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-[hsl(var(--gold))]" />
                )}
                <Icon className="h-4 w-4 shrink-0" />
                {label}
                {showBadge && itemCount > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[hsl(var(--red))] px-1.5 text-[10px] font-bold text-white">
                    {itemCount}
                  </span>
                )}
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

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t-2 border-[hsl(var(--gold))] bg-[hsl(var(--navy))] md:hidden">
        {NAV_ITEMS.slice(0, 5).map(({ href, label, icon: Icon, showBadge }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium tracking-wide",
                active ? "text-[hsl(var(--gold))]" : "text-white/55"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
              {showBadge && itemCount > 0 && (
                <span className="absolute right-2 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[hsl(var(--red))] px-1 text-[9px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
