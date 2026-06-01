/**
 * Resolves the public-facing app URL for auth callbacks, invite links, and Socket.IO CORS.
 *
 * Priority:
 * 1. BASE_URL — canonical public URL (ngrok or production)
 * 2. NEXTAUTH_URL — legacy auth URL fallback
 * 3. http://localhost:{PORT} — local development default
 */

const DEFAULT_LOCAL_PORT = process.env.PORT ?? "3000";

/** Strips trailing slashes from a URL string. */
function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

/**
 * Returns the configured public base URL (server-side).
 * Used by ngrok setup, Socket.IO CORS, and SSR invite links.
 */
export function getPublicAppBaseUrl(): string {
  if (process.env.BASE_URL) {
    return normalizeBaseUrl(process.env.BASE_URL);
  }
  if (process.env.NEXTAUTH_URL) {
    return normalizeBaseUrl(process.env.NEXTAUTH_URL);
  }
  return `http://localhost:${DEFAULT_LOCAL_PORT}`;
}

/**
 * Origins allowed to connect to the Socket.IO server.
 * Includes both local dev and the public ngrok/production URL.
 */
export function getAllowedSocketOrigins(): string[] {
  const publicBaseUrl = getPublicAppBaseUrl();
  const localPort = process.env.PORT ?? "3000";
  const localOrigins = [
    `http://localhost:${localPort}`,
    `http://127.0.0.1:${localPort}`,
  ];

  const origins = new Set([...localOrigins, publicBaseUrl]);
  return Array.from(origins);
}

/** True when ngrok tunnel credentials are present in the environment. */
export function isNgrokConfigured(): boolean {
  return Boolean(process.env.NGROK_AUTHTOKEN?.trim());
}

/**
 * Applies the resolved public URL to runtime env vars used by NextAuth and clients.
 * Called after ngrok tunnel is established or on startup when BASE_URL is preset.
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

/** True when the current host is an ngrok domain (used for skip-browser-warning header). */
export function isNgrokHost(hostname?: string): boolean {
  const host = hostname ?? (typeof window !== "undefined" ? window.location.hostname : "");
  return host.includes("ngrok") || Boolean(process.env.NGROK_DOMAIN?.includes(host));
}
