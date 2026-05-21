import type { Prisma } from "@prisma/client";

/**
 * Allocates the next sequential receipt number, e.g. "VP-2026-0001".
 * The counter resets each calendar year and is race-safe when called
 * inside a transaction.
 */
export async function nextReceiptNumber(
  tx: Prisma.TransactionClient
): Promise<string> {
  const year = new Date().getFullYear();
  const seq = await tx.receiptSequence.upsert({
    where: { year },
    create: { year, lastValue: 1 },
    update: { lastValue: { increment: 1 } },
  });
  return `VP-${year}-${String(seq.lastValue).padStart(4, "0")}`;
}
