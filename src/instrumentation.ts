import type { Instrumentation } from "next";

/**
 * Runs once when a new Next.js server instance starts.
 * Register observability tooling here (OpenTelemetry, Sentry, Datadog, ...).
 * See docs/observability.md.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logger } = await import("@/lib/logger");
    logger.info("Server instance started", {
      runtime: process.env.NEXT_RUNTIME,
      env: process.env.NODE_ENV,
    });
  }
}

/**
 * Called for every uncaught server error (rendering, Route Handlers,
 * Server Actions, Proxy). Forward to your error tracker here.
 */
export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  const { logger } = await import("@/lib/logger");
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String(error.digest)
      : undefined;

  logger.error("Unhandled request error", {
    error,
    digest,
    path: request.path,
    method: request.method,
    requestId: request.headers["x-request-id"],
    routePath: context.routePath,
    routeType: context.routeType,
  });
};
