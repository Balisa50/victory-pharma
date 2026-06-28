/**
 * One-time backfill for the warehouse layer.
 * Moves each product's legacy stockQuantity into availableUnits and sets a
 * sane unitsPerCarton. Safe to re-run - only seeds products still at zero.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, stockQuantity: true, availableUnits: true },
  });

  let migrated = 0;
  for (const p of products) {
    // Only seed products that have not been given warehouse data yet.
    if (p.availableUnits > 0) continue;
    await prisma.product.update({
      where: { id: p.id },
      data: {
        availableUnits: p.stockQuantity ?? 0,
        unitsPerCarton: 1,
        cartonsInStock: 0,
        lowStockThreshold: 10,
      },
    });
    migrated += 1;
  }

  console.log(`Warehouse backfill complete. Products seeded: ${migrated}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
