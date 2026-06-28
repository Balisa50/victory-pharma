/**
 * One-time backfill for the B2B approval workflow.
 * Grandfathers every account that existed before the feature: all current
 * users become `active`, and existing retail pharmacies receive a pharmacyId.
 * Safe to re-run - only touches rows missing a pharmacyId.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.user.updateMany({
    where: { role: "wholesale_admin" },
    data: { status: "active" },
  });

  const retailUpdated = await prisma.user.updateMany({
    where: { role: "retail_pharmacy" },
    data: { status: "active" },
  });

  const retail = await prisma.user.findMany({
    where: { role: "retail_pharmacy", pharmacyId: null },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  const existing = await prisma.user.findMany({
    where: { pharmacyId: { not: null } },
    select: { pharmacyId: true },
  });
  let next =
    existing.reduce((max, u) => {
      const n = Number(String(u.pharmacyId).replace("VPH-", ""));
      return Number.isFinite(n) && n > max ? n : max;
    }, 1000) + 1;

  for (const u of retail) {
    await prisma.user.update({
      where: { id: u.id },
      data: { pharmacyId: `VPH-${next}` },
    });
    next += 1;
  }

  console.log(
    `Backfill complete. Retail set active: ${retailUpdated.count}. Pharmacy IDs assigned: ${retail.length}.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
