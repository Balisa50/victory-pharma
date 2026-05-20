"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

type Props = {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => Promise<void>;
};

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  destructive = false,
  onConfirm,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-2 text-lg font-semibold text-gray-900">{title}</h2>
            <p className="mb-6 text-sm text-gray-500">{description}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60 ${
                  destructive ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
