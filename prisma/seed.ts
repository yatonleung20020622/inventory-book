import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../lib/generated/prisma/client";

const sslEnabled =
  process.env.DATABASE_SSL === "true" ||
  process.env.DATABASE_URL?.includes("ssl-mode=REQUIRED") === true;

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST ?? "127.0.0.1",
  port: Number(process.env.DATABASE_PORT ?? 3306),
  user: process.env.DATABASE_USER ?? "root",
  password: process.env.DATABASE_PASSWORD ?? "",
  database: process.env.DATABASE_NAME ?? "inventory_book",
  connectionLimit: 5,
  ...(sslEnabled ? { ssl: { rejectUnauthorized: true } } : {}),
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "yatonleung20020622@gmail.com";
  const passwordHash = await bcrypt.hash("password", 12);

  const username = "Andrew Leung";
  const phone = "66913032";
  const role = "ADMIN" as const;

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, username, phone, role },
    create: { email, username, phone, passwordHash, role },
  });

  console.log(`Seeded user: ${username} <${email}> phone=${phone} role=${role}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
