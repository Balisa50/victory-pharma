"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      void error;
    }
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <AlertTriangle className="h-12 w-12 text-red-500" />
      <h1 className="text-xl font-bold text-gray-900">Something went wrong</h1>
      <p className="text-sm text-gray-500">An unexpected error occurred. Please try again.</p>
      <button
        onClick={reset}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  );
}
