"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, X, UserPlus } from "lucide-react";

export function AddManagerModal({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!name || !email || !phone || password.length < 8) {
      toast.error("Fill all fields. Password must be 8+ characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/managers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (json.success) {
        toast.success("Manager account created");
        onDone();
      } else {
        toast.error(json.error ?? "Failed to create manager");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[hsl(var(--navy))]/40 px-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-[hsl(var(--navy))]/10">
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <UserPlus className="h-4 w-4 text-[hsl(var(--red-2))]" />
            <p className="serif text-[16px] text-[hsl(var(--navy))]">
              New manager
            </p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3 px-6 py-5">
          <div>
            <label className="eyebrow mb-1 block text-[hsl(var(--red-2))]">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="field w-full" />
          </div>
          <div>
            <label className="eyebrow mb-1 block text-[hsl(var(--red-2))]">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field w-full" />
          </div>
          <div>
            <label className="eyebrow mb-1 block text-[hsl(var(--red-2))]">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="field w-full" />
          </div>
          <div>
            <label className="eyebrow mb-1 block text-[hsl(var(--red-2))]">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="field w-full" />
            <p className="mt-1 text-[11.5px] text-neutral-500">
              Share this with the manager so they can log in. Min 8 characters.
            </p>
          </div>
          <div className="rounded-md bg-[hsl(var(--offwhite))] px-3 py-2 text-[11.5px] leading-relaxed text-neutral-500">
            Managers can run operations (orders, stock, expenses, credit) but
            cannot manage users, settings, news, or contact info.
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-neutral-100 px-6 py-3">
          <button onClick={onClose} className="btn btn-ghost" disabled={loading}>
            Cancel
          </button>
          <button onClick={submit} className="btn btn-navy" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create manager
          </button>
        </div>
      </div>
    </div>
  );
}
