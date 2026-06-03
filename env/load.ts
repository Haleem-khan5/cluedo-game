/**
 * Loads environment files before any other app code runs.
 * Import this as the first line of server.ts and next.config.ts.
 *
 * Load order (later files override earlier):
 *   .env → .env.{staging|production} → .env.local
 */
import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";
import { applyPlatformPublicUrl } from "../src/lib/config/platformUrl";

export type AppEnvironment = "staging" | "production";

function resolveAppEnvironment(): AppEnvironment {
  const explicit = process.env.APP_ENV?.trim().toLowerCase();
  if (explicit === "production") return "production";
  if (explicit === "staging") return "staging";
  return process.env.NODE_ENV === "production" ? "production" : "staging";
}

const appEnvironment = resolveAppEnvironment();
process.env.APP_ENV = appEnvironment;

const envFiles = [".env", `.env.${appEnvironment}`, ".env.local"];

for (const file of envFiles) {
  const filePath = resolve(process.cwd(), file);
  if (existsSync(filePath)) {
    config({ path: filePath, override: true, quiet: true });
  }
}

applyPlatformPublicUrl();

export { appEnvironment };
