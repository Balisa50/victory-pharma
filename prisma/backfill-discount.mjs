import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Subtotal == totalAmount for any order that pre-dates the discount feature.
const result = await prisma.order.updateMany({
  where: { subtotal: null },
  data: {},
});
// updateMany cannot reference another column directly; do it explicitly.
const rows = await prisma.order.findMany({
  where: { subtotal: null },
  select: { id: true, totalAmount: true },
});
for (const r of rows) {
  await prisma.order.update({ where: { id: r.id }, data: { subtotal: r.totalAmount } });
}
console.log(`Discount backfill complete. Orders updated: ${rows.length}.`);
await prisma.$disconnect();
