import { PackageOpen } from "lucide-react";

export function EmptyState({ message = "Nothing here yet." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3.5 py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-[hsl(var(--navy))]/5">
        <PackageOpen className="h-6 w-6 text-[hsl(var(--navy))]/40" />
      </div>
      <p className="max-w-xs text-[13px] font-light leading-relaxed text-neutral-500">
        {message}
      </p>
    </div>
  );
}
