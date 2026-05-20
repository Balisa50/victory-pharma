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
  MessageSquareWarning,
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
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col border-r border-gray-100 bg-white md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-gray-100 px-6">
          <Pill className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-blue-900">Victory Pharma</span>
        </div>
        <div className="px-4 py-3">
          <p className="truncate text-xs text-gray-500">{pharmacyName ?? "Retail Pharmacy"}</p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon, showBadge }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith(href)
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {showBadge && itemCount > 0 && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                  {itemCount}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="border-t border-gray-100 p-3">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-gray-200 bg-white md:hidden">
        {NAV_ITEMS.slice(0, 5).map(({ href, label, icon: Icon, showBadge }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium",
              pathname.startsWith(href) ? "text-blue-600" : "text-gray-500"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
            {showBadge && itemCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">
                {itemCount}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </>
  );
}
