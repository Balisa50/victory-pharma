import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: "admin@victory.com" } });
  if (existing) return;

  const hashed = await bcrypt.hash("ChangeMe123!", 12);

  await prisma.user.create({
    data: {
      name: "Victory Admin",
      email: "admin@victory.com",
      password: hashed,
      phone: process.env.CONTACT_PHONE ?? "+220 000 0000",
      role: UserRole.wholesale_admin,
    },
  });
}

main()
  .catch((e) => {
    process.stderr.write(String(e) + "\n");
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
