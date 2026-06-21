import "./env/load";
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { initSocketServer } from "./server/socket";
import { startNgrokTunnel, logPublicUrlConfiguration } from "./server/ngrokTunnel";
import { ensureDatabaseReady } from "./server/dbInit";
import { getPublicAppBaseUrl } from "@/lib/config/publicAppUrl";
import {
  getAppEnvironment,
  isStagingEnvironment,
  shouldEnableNgrokTunnel,
  validateProductionEnvironment,
} from "@/lib/config/appEnv";

const appEnvironment = getAppEnvironment();
const isDevMode = appEnvironment === "staging";
const serverHostname =
  process.env.HOSTNAME ??
  (appEnvironment === "production" ? "0.0.0.0" : "localhost");
const serverPort = parseInt(process.env.PORT ?? "3001", 10);

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
  console.log(`> Environment: ${appEnvironment}`);

  for (const warning of validateProductionEnvironment()) {
    console.warn(`> WARNING: ${warning}`);
  }

  try {
    await ensureDatabaseReady();
  } catch {
    console.error("> Server starting without a healthy database — auth and lobbies will fail.");
  }

  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handleNextRequest(req, res, parsedUrl);
  });

  initSocketServer(httpServer);

  httpServer.listen(serverPort, async () => {
    console.log(`> Cluebound Chronicles ready on http://${serverHostname}:${serverPort}`);

    if (shouldEnableNgrokTunnel()) {
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
      logPublicUrlConfiguration();
      if (isStagingEnvironment()) {
        console.log("> [staging] Local only — add NGROK_AUTHTOKEN to .env for public access");
      }
    }

    console.log(`> Auth callback URL: ${getPublicAppBaseUrl()}/api/auth/callback/google`);
  });
});
