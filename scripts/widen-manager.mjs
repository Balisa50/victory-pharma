// Widen specific admin-only API routes + the wholesale layout to also accept
// the manager role. We pick the files explicitly so we don't accidentally
// open up admin-only spaces (users, verify-pharmacy, news, settings).
import { readFileSync, writeFileSync } from "node:fs";

const WIDEN_FILES = [
  "src/app/(dashboard)/wholesale/layout.tsx",
  "src/app/api/dashboard/wholesale/route.ts",
  "src/app/api/admin/reports/route.ts",
  "src/app/api/orders/[id]/discount/route.ts",
  "src/app/api/payments/[id]/confirm/route.ts",
  "src/app/api/credit/payments/route.ts",
  "src/app/api/credit/pharmacies/[id]/route.ts",
  "src/app/api/expenses/route.ts",
  "src/app/api/expenses/[id]/route.ts",
  "src/app/api/products/route.ts",
  "src/app/api/products/[id]/route.ts",
  "src/app/api/products/bulk-import/route.ts",
  "src/app/api/products/bulk-upload/route.ts",
  "src/app/api/products/template/route.ts",
  "src/app/api/complaints/route.ts",
  "src/app/api/complaints/[id]/route.ts",
  "src/app/api/reviews/route.ts",
  "src/app/api/orders/route.ts",
];

const transforms = [
  // Standard guard: session?.user?.role !== "wholesale_admin"
  {
    re: /session\?\.user\?\.role\s*!==\s*"wholesale_admin"/g,
    to: '(session?.user?.role !== "wholesale_admin" && session?.user?.role !== "manager")',
  },
  // Server-side comparison: account.role !== "wholesale_admin"
  {
    re: /account\?\.role\s*!==\s*"wholesale_admin"/g,
    to: '(account?.role !== "wholesale_admin" && account?.role !== "manager")',
  },
  // Inverse: session.user.role === "wholesale_admin"  (used to compute isAdmin)
  {
    re: /session\.user\.role\s*===\s*"wholesale_admin"/g,
    to: '(session.user.role === "wholesale_admin" || session.user.role === "manager")',
  },
];

for (const f of WIDEN_FILES) {
  let src = readFileSync(f, "utf8");
  const before = src;
  for (const t of transforms) src = src.replace(t.re, t.to);
  if (src !== before) {
    writeFileSync(f, src);
    console.log("widened", f);
  } else {
    console.log("no change", f);
  }
}
