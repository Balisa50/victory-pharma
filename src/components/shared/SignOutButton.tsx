"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton({
  className,
  label = "Sign out",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className={className ?? "btn btn-ghost"}
    >
      <LogOut className="h-4 w-4" />
      {label}
    </button>
  );
}
