import { isProductionEnvironment } from "./appEnv";
import { syncPublicUrlEnvironment } from "./publicAppUrl";

/**
 * Free hosting platforms expose a public URL via env vars.
 * Auto-fill BASE_URL / NEXTAUTH_URL when not manually set.
 */
export function applyPlatformPublicUrl(): void {
  if (!isProductionEnvironment()) return;
  if (process.env.BASE_URL?.trim() || process.env.NEXTAUTH_URL?.trim()) return;

  const detected = detectPlatformPublicUrl();
  if (detected) {
    syncPublicUrlEnvironment(detected);
    console.log(`> Public URL (auto-detected): ${detected}`);
  }
}

function detectPlatformPublicUrl(): string | null {
  const candidates: (string | undefined)[] = [
    process.env.RENDER_EXTERNAL_URL?.trim(),
    process.env.RENDER_EXTERNAL_HOSTNAME
      ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`
      : undefined,
    process.env.RAILWAY_PUBLIC_DOMAIN
      ? normalizeHttps(process.env.RAILWAY_PUBLIC_DOMAIN)
      : undefined,
    process.env.RAILWAY_STATIC_URL?.trim(),
    process.env.FLY_APP_NAME ? `https://${process.env.FLY_APP_NAME}.fly.dev` : undefined,
    process.env.COOLIFY_FQDN ? normalizeHttps(process.env.COOLIFY_FQDN) : undefined,
  ];

  for (const url of candidates) {
    if (url) return url.replace(/\/$/, "");
  }
  return null;
}

function normalizeHttps(value: string): string {
  const trimmed = value.trim().replace(/\/$/, "");
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}
