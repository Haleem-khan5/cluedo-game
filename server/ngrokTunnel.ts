import ngrok from "@ngrok/ngrok";
import {
  getPublicAppBaseUrl,
  isNgrokConfigured,
  syncPublicUrlEnvironment,
} from "@/lib/config/publicAppUrl";

export interface NgrokTunnelResult {
  /** Full public HTTPS URL, e.g. https://your-domain.ngrok-free.dev */
  publicBaseUrl: string;
  /** Hostname only, e.g. your-domain.ngrok-free.dev */
  ngrokDomain: string;
  /** ngrok listener instance — call close() on shutdown */
  listener: ngrok.Listener;
}

/**
 * Starts an ngrok tunnel to the local HTTP server using credentials from .env:
 * - NGROK_AUTHTOKEN (required)
 * - NGROK_DOMAIN (optional reserved domain)
 * - NGROK_REGION (optional, default "us")
 * - BASE_URL (optional preset; updated if tunnel URL differs)
 */
export async function startNgrokTunnel(localPort: number): Promise<NgrokTunnelResult | null> {
  if (!isNgrokConfigured()) {
    return null;
  }

  const ngrokAuthToken = process.env.NGROK_AUTHTOKEN!.trim();
  const reservedNgrokDomain = process.env.NGROK_DOMAIN?.trim();
  const ngrokRegion = process.env.NGROK_REGION?.trim() || "us";

  console.log("> Starting ngrok tunnel...");

  const forwardConfig: ngrok.Config = {
    addr: localPort,
    authtoken: ngrokAuthToken,
    region: ngrokRegion,
  };

  if (reservedNgrokDomain) {
    forwardConfig.domain = reservedNgrokDomain;
  }

  const listener = await ngrok.forward(forwardConfig);
  const tunnelUrl = listener.url();

  if (!tunnelUrl) {
    throw new Error("ngrok tunnel started but returned no public URL");
  }

  const publicBaseUrl = tunnelUrl.replace(/\/$/, "");
  const ngrokDomain = new URL(publicBaseUrl).hostname;

  syncPublicUrlEnvironment(publicBaseUrl);

  console.log("> ngrok tunnel active");
  console.log(`> Public URL:  ${publicBaseUrl}`);
  console.log(`> ngrok domain: ${ngrokDomain}`);
  console.log(`> Region:       ${ngrokRegion}`);
  console.log("> Share this URL with friends to play online");

  return { publicBaseUrl, ngrokDomain, listener };
}

/**
 * Logs the current public URL configuration when ngrok is not used
 * but BASE_URL is already set in .env.
 */
export function logPresetPublicUrl(): void {
  const presetBaseUrl = process.env.BASE_URL?.trim();
  if (presetBaseUrl && !isNgrokConfigured()) {
    syncPublicUrlEnvironment(presetBaseUrl);
    console.log(`> Public URL (from BASE_URL): ${getPublicAppBaseUrl()}`);
  }
}
