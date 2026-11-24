# Observability

## Logging

Use the structured logger from `src/lib/logger.ts`, never `console.log` (ESLint warns).

```ts
import { logger } from "@/lib/logger";

logger.info("Todo created", { todoId: todo.id });
logger.error("Payment failed", { orderId, error }); // Errors are serialized with stack + cause

const log = logger.child({ feature: "billing" }); // bind context once
log.warn("Retrying webhook", { attempt: 2 });
```

| Environment | Output                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------ |
| development | `[INFO] Todo created { todoId: "…" }`                                                      |
| production  | `{"level":"info","time":"…","msg":"Todo created","todoId":"…"}` (one JSON object per line) |

Set verbosity with `LOG_LEVEL` (`debug`, `info`, `warn`, `error`).

**Never log** passwords, tokens, API keys, full payment data, or more personal data
than you need.

To switch to **pino**, **winston**, or an OpenTelemetry logger, re-implement
`createLogger` in that one file. Call sites don't change.

## Request IDs

`src/proxy.ts` gives every request an `x-request-id`. It reuses an incoming ID from a
load balancer, or creates a UUID. The ID is:

- forwarded to the app, so `(await headers()).get("x-request-id")` works,
- returned in the response header, so users and support can quote it,
- included in `onRequestError` logs.

## Uncaught server errors

`src/instrumentation.ts`:

- `register()` runs once per server instance. Initialize SDKs here.
- `onRequestError()` runs for every uncaught server error, with the route, route type
  and digest. The digest is also shown to users on error pages as a "Reference".

### Adding Sentry (example)

```bash
pnpm dlx @sentry/wizard@latest -i nextjs
```

Then call `Sentry.captureRequestError` from `onRequestError`, and capture client
errors in `ErrorView`'s `useEffect`.

### Adding OpenTelemetry

```bash
pnpm add @vercel/otel @opentelemetry/api
```

```ts
// src/instrumentation.ts
import { registerOTel } from "@vercel/otel";
export function register() {
  registerOTel({ serviceName: "zed-next" });
}
```

Next.js emits spans for routes, rendering and fetches automatically.

## Health checks

`GET /api/health` returns `{ status, timestamp, uptime }` with `Cache-Control: no-store`.
The Docker image's `HEALTHCHECK` and the E2E suite both use it. Extend it with
dependency checks (database ping and so on), and return HTTP 503 when a critical
dependency is down.

## Web Vitals

To report Core Web Vitals to your analytics, add a client component using
`useReportWebVitals` from `next/web-vitals`, or use Vercel Speed Insights.
