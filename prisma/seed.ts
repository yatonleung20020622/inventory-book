import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../lib/generated/prisma/client";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST ?? "127.0.0.1",
  port: Number(process.env.DATABASE_PORT ?? 3306),
  user: process.env.DATABASE_USER ?? "root",
  password: process.env.DATABASE_PASSWORD ?? "",
  database: process.env.DATABASE_NAME ?? "inventory_book",
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "yatonleung20020622@gmail.com";
  const passwordHash = await bcrypt.hash("seeder", 12);

  const username = "Andrew Leung";

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, username },
    create: { email, username, passwordHash },
  });

  console.log(`Seeded user: ${username} <${email}>`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
