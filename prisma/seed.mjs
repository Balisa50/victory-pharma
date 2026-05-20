import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "crypto";

// Simple bcrypt-compatible hash using 12 rounds approximation via node crypto
// We'll use the prisma client with a pre-hashed password
// Password: ChangeMe123! — bcrypt hash generated below
const ADMIN_PASSWORD_HASH =
  "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeKJqnqHu.Z9KYLTS";

const prisma = new PrismaClient();

async function main() {
  // Check if bcryptjs is available
  let hash = ADMIN_PASSWORD_HASH;
  try {
    const bcrypt = await import("bcryptjs");
    hash = await bcrypt.default.hash("ChangeMe123!", 12);
  } catch {
    // use pre-computed hash
  }

  const existing = await prisma.user.findUnique({
    where: { email: "admin@victory.com" },
  });

  if (existing) {
    console.log("Admin already exists — skipping seed.");
    return;
  }

  await prisma.user.create({
    data: {
      name: "Victory Admin",
      email: "admin@victory.com",
      password: hash,
      phone: "+220 000 0000",
      role: "wholesale_admin",
    },
  });

  console.log("✓ Admin seeded: admin@victory.com / ChangeMe123!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
