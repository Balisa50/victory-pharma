import Link from "next/link";
import { PackageSearch } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <PackageSearch className="h-16 w-16 text-gray-300" />
      <h1 className="text-2xl font-bold text-gray-900">Page not found</h1>
      <p className="text-sm text-gray-500">The page you are looking for does not exist.</p>
      <Link
        href="/"
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Go home
      </Link>
    </div>
  );
}
