import "dotenv/config";
import mariadb from "mariadb";

const host = process.env.DATABASE_HOST ?? "127.0.0.1";
const port = Number(process.env.DATABASE_PORT ?? 3306);
const user = process.env.DATABASE_USER ?? "root";
const password = process.env.DATABASE_PASSWORD ?? "";
const database = process.env.DATABASE_NAME ?? "inventory_book";
const sslEnabled =
  process.env.DATABASE_SSL === "true" ||
  process.env.DATABASE_URL?.includes("ssl-mode=REQUIRED") === true;

async function main() {
  const connection = await mariadb.createConnection({
    host,
    port,
    user,
    password,
    connectTimeout: 30_000,
    ...(sslEnabled ? { ssl: { rejectUnauthorized: true } } : {}),
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    console.log(`Database ready: ${database}`);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
