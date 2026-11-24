# syntax=docker/dockerfile:1
# ─────────────────────────────────────────────────────────────
# Production image using Next.js standalone output.
#   docker build -t zed-next .
#   docker run -p 3000:3000 -e NEXT_PUBLIC_APP_URL=http://localhost:3000 zed-next
# NEXT_PUBLIC_* values are inlined at BUILD time; pass them as --build-arg.
# ─────────────────────────────────────────────────────────────

# Keep the Node major in sync with .nvmrc. Literal tags let Dependabot update them.

# ---- base ----
FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /app

# ---- deps: install with a cached pnpm store ----
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

# ---- builder ----
FROM base AS builder
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL} \
    NEXT_OUTPUT=standalone \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ---- runner: minimal runtime image ----
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
