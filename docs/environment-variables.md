# Environment variables

All configuration comes from environment variables. They are **validated with Zod at
build time and startup** through [`@t3-oss/env-nextjs`](https://env.t3.gg), in
`src/config/env.ts`.

## Files

| File                                  | Committed       | Purpose                                      |
| ------------------------------------- | --------------- | -------------------------------------------- |
| `.env.example`                        | ✅              | Documents every variable, with safe defaults |
| `.env.local`                          | ❌              | Your local values (git-ignored)              |
| `.env.production`, `.env.development` | ❌ (by default) | Per-environment defaults, if you need them   |

Load order is defined by Next.js: `.env.$(NODE_ENV).local` > `.env.local` >
`.env.$(NODE_ENV)` > `.env`.

## Current variables

| Variable              | Scope  | Default                 | Description                                         |
| --------------------- | ------ | ----------------------- | --------------------------------------------------- |
| `NODE_ENV`            | server | `development`           | Set by Next.js                                      |
| `LOG_LEVEL`           | server | `info`                  | `debug`, `info`, `warn` or `error`                  |
| `NEXT_PUBLIC_APP_URL` | client | `http://localhost:3000` | Canonical URL (metadata, sitemap, OG)               |
| `SKIP_ENV_VALIDATION` | build  | unset                   | `true` skips validation (e.g. lint-only CI jobs)    |
| `NEXT_OUTPUT`         | build  | unset                   | `standalone` emits a self-contained server (Docker) |

## Adding a variable

1. Declare it in `src/config/env.ts`:

   ```ts
   server: {
     DATABASE_URL: z.url(),
     STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
   },
   client: {
     NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1),
   },
   experimental__runtimeEnv: {
     NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY, // client vars only
   },
   ```

2. Document it in `.env.example`, with a comment.
3. Add it to your hosting provider and to CI secrets if the build needs it.
4. Use it through the typed object, never `process.env` directly:

   ```ts
   import { env } from "@/config/env";
   const db = connect(env.DATABASE_URL);
   ```

## Rules

- **Secrets are server-only.** Anything prefixed `NEXT_PUBLIC_` is **inlined into the
  JavaScript bundle at build time** and is public. Never prefix secrets with it.
- Reading a `server` variable from client code throws a clear error.
- Because `NEXT_PUBLIC_*` values are inlined at build time, changing one requires a
  **rebuild**. For Docker, pass them as `--build-arg`.
- `env.ts` must not use `@/` path aliases, because `next.config.ts` imports it before
  aliases resolve.
