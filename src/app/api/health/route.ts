import { connection } from "next/server";

/**
 * Liveness/readiness probe for load balancers, Kubernetes and uptime monitors.
 * `connection()` opts out of prerendering so every request is evaluated live.
 *
 * Extend with dependency checks (database, cache, ...) and return 503 when a
 * critical dependency is down.
 */
export async function GET() {
  await connection();

  return Response.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
