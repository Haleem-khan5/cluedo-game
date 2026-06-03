import ngrok from "@ngrok/ngrok";
import {
  getPublicAppBaseUrl,
  syncPublicUrlEnvironment,
} from "@/lib/config/publicAppUrl";
import { shouldEnableNgrokTunnel } from "@/lib/config/appEnv";

export interface NgrokTunnelResult {
  /** Full public HTTPS URL, e.g. https://your-domain.ngrok-free.dev */
  publicBaseUrl: string;
  /** Hostname only, e.g. your-domain.ngrok-free.dev */
  ngrokDomain: string;
  /** ngrok listener instance — call close() on shutdown */
  listener: ngrok.Listener;
}

/**
 * Starts an ngrok tunnel — **staging only** (localhost dev).
 * Requires NGROK_AUTHTOKEN in .env.staging / local .env.
 */
export async function startNgrokTunnel(localPort: number): Promise<NgrokTunnelResult | null> {
  if (!shouldEnableNgrokTunnel()) {
    return null;
  }

  const ngrokAuthToken = process.env.NGROK_AUTHTOKEN!.trim();
  const reservedNgrokDomain = process.env.NGROK_DOMAIN?.trim();
  const ngrokRegion = process.env.NGROK_REGION?.trim() || "us";

  console.log("> [staging] Starting ngrok tunnel...");

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

  console.log("> [staging] ngrok tunnel active");
  console.log(`> Public URL:  ${publicBaseUrl}`);
  console.log(`> ngrok domain: ${ngrokDomain}`);
  console.log(`> Region:       ${ngrokRegion}`);
  console.log("> Share this URL with friends to play online");

  return { publicBaseUrl, ngrokDomain, listener };
}

/** Logs preset BASE_URL when ngrok is not used (staging with manual URL, or production). */
export function logPublicUrlConfiguration(): void {
  const presetBaseUrl = process.env.BASE_URL?.trim();
  if (presetBaseUrl && !shouldEnableNgrokTunnel()) {
    syncPublicUrlEnvironment(presetBaseUrl);
    console.log(`> Public URL: ${getPublicAppBaseUrl()}`);
  }
}
