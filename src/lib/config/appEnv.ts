/**
 * Application environment — staging (local dev) vs production (deployed).
 *
 * - staging: localhost + optional ngrok tunnel for sharing with friends
 * - production: single deployed app with BASE_URL — ngrok is never used
 */

export type AppEnvironment = "staging" | "production";

/** Current environment (from APP_ENV, or inferred from NODE_ENV). */
export function getAppEnvironment(): AppEnvironment {
  const env = process.env.APP_ENV?.trim().toLowerCase();
  if (env === "production" || env === "staging") return env;
  return process.env.NODE_ENV === "production" ? "production" : "staging";
}

export function isStagingEnvironment(): boolean {
  return getAppEnvironment() === "staging";
}

export function isProductionEnvironment(): boolean {
  return getAppEnvironment() === "production";
}

/** ngrok runs only in staging when NGROK_AUTHTOKEN is set. Never in production. */
export function shouldEnableNgrokTunnel(): boolean {
  if (!isStagingEnvironment()) return false;
  return Boolean(process.env.NGROK_AUTHTOKEN?.trim());
}

/** Validates required production settings — logs warnings, does not throw. */
export function validateProductionEnvironment(): string[] {
  const warnings: string[] = [];
  if (!isProductionEnvironment()) return warnings;

  if (!process.env.BASE_URL?.trim() && !process.env.NEXTAUTH_URL?.trim()) {
    warnings.push("Set BASE_URL and NEXTAUTH_URL to your public HTTPS URL.");
  }
  if (!process.env.AUTH_SECRET?.trim()) {
    warnings.push("AUTH_SECRET is required in production.");
  }
  if (process.env.NGROK_AUTHTOKEN?.trim()) {
    warnings.push("NGROK_AUTHTOKEN is ignored in production — remove it from production env.");
  }
  return warnings;
}
