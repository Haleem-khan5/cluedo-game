import "dotenv/config";
import type { NextConfig } from "next";

/** Hostnames allowed to use Next.js dev HMR when accessed via ngrok. */
function getNgrokDevOrigins(): string[] {
  const reservedDomain = process.env.NGROK_DOMAIN?.trim();
  if (reservedDomain) return [reservedDomain];

  const baseUrl = process.env.BASE_URL?.trim();
  if (baseUrl) {
    try {
      return [new URL(baseUrl).hostname];
    } catch {
      // ignore invalid BASE_URL
    }
  }
  return [];
}

const nextConfig: NextConfig = {
  allowedDevOrigins: getNgrokDevOrigins(),
};

export default nextConfig;
