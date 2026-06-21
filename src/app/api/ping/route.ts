/** Public liveness probe for Render, Railway, Fly.io, Docker healthchecks. */
export async function GET() {
  return Response.json({
    status: "ok",
    app: "cluebound-chronicles",
    env: process.env.APP_ENV ?? "unknown",
  });
}
