/**
 * Resolves the public-facing app URL for auth callbacks, invite links, and Socket.IO CORS.
 *
 * staging: localhost default; ngrok URL applied at runtime when tunnel starts
 * production: BASE_URL / NEXTAUTH_URL must be your deployed HTTPS URL
 */

import {
  getAppEnvironment,
  isStagingEnvironment,
  shouldEnableNgrokTunnel,
} from "./appEnv";

const DEFAULT_LOCAL_PORT = process.env.PORT ?? "3001";

/** Strips trailing slashes from a URL string. */
function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

/**
 * Returns the configured public base URL (server-side).
 * Used by ngrok setup, Socket.IO CORS, and SSR invite links.
 */
export function getPublicAppBaseUrl(): string {
  if (process.env.BASE_URL?.trim()) {
    return normalizeBaseUrl(process.env.BASE_URL.trim());
  }
  if (process.env.NEXTAUTH_URL?.trim()) {
    return normalizeBaseUrl(process.env.NEXTAUTH_URL.trim());
  }
  return `http://localhost:${DEFAULT_LOCAL_PORT}`;
}

/**
 * Origins allowed to connect to the Socket.IO server.
 * Staging includes localhost; production uses only the public URL.
 */
export function getAllowedSocketOrigins(): string[] {
  const publicBaseUrl = getPublicAppBaseUrl();
  const origins = new Set<string>([publicBaseUrl]);

  if (isStagingEnvironment()) {
    const localPort = process.env.PORT ?? "3001";
    origins.add(`http://localhost:${localPort}`);
    origins.add(`http://127.0.0.1:${localPort}`);
  }

  return Array.from(origins);
}

/** @deprecated Use shouldEnableNgrokTunnel from appEnv */
export function isNgrokConfigured(): boolean {
  return shouldEnableNgrokTunnel();
}

/**
 * Applies the resolved public URL to runtime env vars used by NextAuth and clients.
 * Called after ngrok tunnel is established (staging only).
 */
export function syncPublicUrlEnvironment(publicBaseUrl: string): void {
  const normalized = normalizeBaseUrl(publicBaseUrl);
  process.env.BASE_URL = normalized;
  process.env.NEXTAUTH_URL = normalized;
  process.env.NEXT_PUBLIC_BASE_URL = normalized;
}

/** Client-safe public URL (inlined from NEXT_PUBLIC_BASE_URL at build time). */
export function getClientPublicAppBaseUrl(): string {
  if (typeof window !== "undefined") {
    return (
      process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || window.location.origin
    );
  }
  return getPublicAppBaseUrl();
}

/** True when the current host is an ngrok domain (staging tunnel access). */
export function isNgrokHost(hostname?: string): boolean {
  if (!isStagingEnvironment()) return false;
  const host = hostname ?? (typeof window !== "undefined" ? window.location.hostname : "");
  return host.includes("ngrok") || Boolean(process.env.NGROK_DOMAIN?.includes(host));
}

/** Human-readable label for logs and UI. */
export function getEnvironmentLabel(): string {
  return getAppEnvironment();
}
