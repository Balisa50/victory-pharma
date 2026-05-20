"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Star,
  MessageSquareWarning,
  Phone,
  LogOut,
  Pill,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/wholesale/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/wholesale/products", label: "Products", icon: Package },
  { href: "/wholesale/orders", label: "Orders", icon: ClipboardList },
  { href: "/wholesale/reviews", label: "Reviews", icon: Star },
  { href: "/wholesale/complaints", label: "Complaints", icon: MessageSquareWarning },
  { href: "/wholesale/contact", label: "Contact", icon: Phone },
];

export function WholesaleSidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden w-64 flex-col border-r border-gray-100 bg-white md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-gray-100 px-6">
          <Pill className="h-5 w-5 text-emerald-600" />
          <span className="font-semibold text-emerald-900">Victory Admin</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith(href)
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
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

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-gray-200 bg-white md:hidden">
        {NAV_ITEMS.slice(0, 5).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium",
              pathname.startsWith(href) ? "text-emerald-600" : "text-gray-500"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
