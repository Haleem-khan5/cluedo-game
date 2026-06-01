import { execSync } from "child_process";
import { prisma } from "@/lib/prisma";

/**
 * Verifies PostgreSQL is reachable and applies pending migrations if tables are missing.
 */
export async function ensureDatabaseReady(): Promise<void> {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1 FROM "User" LIMIT 1`;
    console.log("> Database connected");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const tablesMissing =
      message.includes("does not exist") ||
      message.includes("P2021") ||
      message.includes("relation");

    if (tablesMissing) {
      console.log("> Database tables missing — applying migrations...");
      try {
        execSync("npx prisma migrate deploy", {
          stdio: "inherit",
          cwd: process.cwd(),
          env: process.env,
        });
        console.log("> Migrations applied");
        return;
      } catch {
        console.error("> Migration failed. Run: docker compose up -d && npm run db:migrate");
        throw err;
      }
    }

    if (message.includes("Can't reach database") || message.includes("ECONNREFUSED")) {
      console.error("> PostgreSQL is not running. Start it with: docker compose up -d");
      throw err;
    }

    throw err;
  }
}
