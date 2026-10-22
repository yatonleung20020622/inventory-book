import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/lib/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const sslEnabled =
    process.env.DATABASE_SSL === "true" ||
    process.env.DATABASE_URL?.includes("ssl-mode=REQUIRED") === true;

  const adapter = new PrismaMariaDb(
    {
      host: process.env.DATABASE_HOST ?? "127.0.0.1",
      port: Number(process.env.DATABASE_PORT ?? 3306),
      user: process.env.DATABASE_USER ?? "root",
      password: process.env.DATABASE_PASSWORD ?? "",
      database: process.env.DATABASE_NAME ?? "inventory_book",
      connectionLimit: 5,
      connectTimeout: 30_000,
      acquireTimeout: 30_000,
      ...(sslEnabled ? { ssl: { rejectUnauthorized: true } } : {}),
    },
    { useTextProtocol: true },
  );

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
