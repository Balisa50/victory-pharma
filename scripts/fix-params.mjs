// One-shot codemod: Next.js 16 requires `params` to be a Promise.
// Converts `{ params }: { params: { id: string } }` -> Promise form,
// inserts `const { id } = await params;` at top of each handler,
// and rewrites `params.id` -> `id`.
import { readFileSync, writeFileSync } from "node:fs";

const files = [
  "src/app/api/expenses/[id]/route.ts",
  "src/app/api/credit/pharmacies/[id]/route.ts",
  "src/app/api/orders/[id]/discount/route.ts",
  "src/app/api/receipts/[id]/print/route.ts",
  "src/app/api/orders/[id]/status/route.ts",
  "src/app/api/payments/[id]/confirm/route.ts",
  "src/app/api/receipts/[id]/route.ts",
  "src/app/api/complaints/[id]/route.ts",
  "src/app/api/orders/[id]/route.ts",
  "src/app/api/products/[id]/route.ts",
];

for (const f of files) {
  let src = readFileSync(f, "utf8");
  const before = src;

  // Type: { params: { id: string } } -> { params: Promise<{ id: string }> }
  src = src.replace(
    /\{\s*params\s*\}\s*:\s*\{\s*params:\s*\{\s*id:\s*string\s*\}\s*\}/g,
    "{ params }: { params: Promise<{ id: string }> }"
  );

  // For every handler signature we just rewrote, inject `const { id } = await params;`
  // right after the opening `{` of the function body. We look for `) {\n` that follows
  // a signature containing `Promise<{ id: string }>`.
  src = src.replace(
    /(export async function (?:GET|POST|PATCH|PUT|DELETE)\s*\([^)]*Promise<\{\s*id:\s*string\s*\}>[^)]*\)\s*\{\n)/g,
    "$1  const { id } = await params;\n"
  );

  // Now replace remaining `params.id` references with `id`.
  src = src.replace(/params\.id\b/g, "id");

  if (src !== before) {
    writeFileSync(f, src);
    console.log("patched", f);
  } else {
    console.log("no change", f);
  }
}
