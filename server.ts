import "dotenv/config";
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { initSocketServer } from "./server/socket";
import { startNgrokTunnel, logPresetPublicUrl } from "./server/ngrokTunnel";
import { getPublicAppBaseUrl, isNgrokConfigured } from "@/lib/config/publicAppUrl";

const isDevMode = process.env.NODE_ENV !== "production";
const serverHostname = process.env.HOSTNAME ?? "localhost";
const serverPort = parseInt(process.env.PORT ?? "3000", 10);

const nextApp = next({ dev: isDevMode, hostname: serverHostname, port: serverPort });
const handleNextRequest = nextApp.getRequestHandler();

let ngrokListener: { close: () => Promise<void> } | null = null;

async function shutdown(signal: string) {
  console.log(`\n> Received ${signal}, shutting down...`);
  if (ngrokListener) {
    await ngrokListener.close();
    console.log("> ngrok tunnel closed");
  }
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

nextApp.prepare().then(async () => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handleNextRequest(req, res, parsedUrl);
  });

  initSocketServer(httpServer);

  httpServer.listen(serverPort, async () => {
    console.log(`> Mystery Mansion ready on http://${serverHostname}:${serverPort}`);

    if (isNgrokConfigured()) {
      try {
        const tunnel = await startNgrokTunnel(serverPort);
        if (tunnel) {
          ngrokListener = tunnel.listener;
        }
      } catch (err) {
        console.error("> Failed to start ngrok tunnel:", err);
        console.error("> Continuing on localhost only. Check NGROK_AUTHTOKEN and NGROK_DOMAIN.");
      }
    } else {
      logPresetPublicUrl();
    }

    if (!isNgrokConfigured() && !process.env.BASE_URL) {
      console.log("> Local only — set NGROK_AUTHTOKEN in .env for public access");
    }

    console.log(`> Auth callback URL: ${getPublicAppBaseUrl()}/api/auth/callback/google`);
  });
});
