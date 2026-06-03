import "./env/load";
import type { NextConfig } from "next";
import { isStagingEnvironment } from "./src/lib/config/appEnv";

/** Hostnames allowed to use Next.js dev HMR when accessed via ngrok (staging only). */
function getNgrokDevOrigins(): string[] {
  if (!isStagingEnvironment()) return [];

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
