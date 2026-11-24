# Deployment

## Pre-deploy checklist

- [ ] `NEXT_PUBLIC_APP_URL` is set to the real public URL (it's inlined at build time)
- [ ] All server env vars from `src/config/env.ts` are configured
- [ ] The todos demo repository is replaced by a real database (in-memory data is
      lost on restart and isn't shared between instances)
- [ ] A shared cache handler is configured if you run more than one instance (see below)
- [ ] Error tracking is wired into `instrumentation.ts`
- [ ] The health check URL is configured in your load balancer or orchestrator

## Vercel

Zero configuration: import the repo, set the env vars, deploy. Cache Components, ISR,
image optimization and the proxy work out of the box. Don't set `NEXT_OUTPUT`.

## Docker (any container platform)

The multi-stage `Dockerfile` builds a minimal image from the Next.js **standalone**
output (enabled by `NEXT_OUTPUT=standalone` in the build stage):

```bash
docker build \
  --build-arg NEXT_PUBLIC_APP_URL=https://app.example.com \
  -t zed-next .

docker run -p 3000:3000 -e LOG_LEVEL=info zed-next
```

The image:

- runs as a non-root user (`nextjs`, uid 1001),
- contains only the traced runtime files, with no dev dependencies or source,
- has a `HEALTHCHECK` against `/api/health`,
- listens on `0.0.0.0:$PORT` (default 3000).

Works on AWS ECS/App Runner, Google Cloud Run, Azure Container Apps, Fly.io, Railway,
Render, and Kubernetes.

### Kubernetes probes

```yaml
livenessProbe:
  httpGet: { path: /api/health, port: 3000 }
readinessProbe:
  httpGet: { path: /api/health, port: 3000 }
```

## Node.js server (no Docker)

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start          # next start on port 3000 (PORT to change)
```

Put a reverse proxy (nginx, Caddy) or load balancer in front for TLS.

## Multiple instances and caching

By default, `"use cache"` entries and ISR output live **in memory and on local disk
per instance**. With more than one instance (or serverless), configure:

- `cacheHandlers` in `next.config.ts` for a shared `"use cache"` store (for example
  Redis), and/or `"use cache: remote"` for data that must be shared,
- a shared **build ID** and **server actions encryption key**
  (`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`) across instances, so Server Actions keep
  working during rolling deploys.

See `node_modules/next/dist/docs/01-app/02-guides/self-hosting.md` for details.

## CI/CD

`.github/workflows/ci.yml` runs on every push to `main` and on every pull request:

| Job       | Steps                                                             |
| --------- | ----------------------------------------------------------------- |
| `quality` | install → lint → typecheck → format check → unit tests + coverage |
| `e2e`     | install → build (with `.next/cache`) → Playwright                 |
| `docker`  | build the image (PRs only, with a layer cache)                    |

To add continuous deployment, add a job after `quality` and `e2e` that deploys on
pushes to `main`, or let your platform's Git integration (Vercel, Render…) handle it.
Protect `main` by requiring these checks to pass.
