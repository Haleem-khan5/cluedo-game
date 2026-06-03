/** Public liveness probe for Render, Railway, Fly.io, Docker healthchecks. */
export async function GET() {
  return Response.json({
    status: "ok",
    app: "mystery-mansion",
    env: process.env.APP_ENV ?? "unknown",
  });
}
