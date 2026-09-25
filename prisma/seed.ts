import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@example.com").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "ChangeThisStrongPassword";
  const name = process.env.ADMIN_NAME || "Admin";

  const hash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { name, password: hash, role: "admin" },
    });
    console.log(`Updated admin: ${email}`);
  } else {
    await prisma.user.create({
      data: { name, email, password: hash, role: "admin" },
    });
    console.log(`Created admin: ${email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
