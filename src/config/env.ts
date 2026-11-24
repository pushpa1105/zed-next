import { createEnv } from "@t3-oss/env-nextjs";

// Relative import: `@/` aliases are not resolved when next.config.ts loads this file.
import { z } from "../lib/validation";

/**
 * Type-safe, validated environment variables.
 *
 * - Add every new variable here AND to `.env.example`.
 * - `server` vars are only readable on the server; reading them in a
 *   Client Component throws.
 * - `client` vars must be prefixed with `NEXT_PUBLIC_` and are inlined at
 *   build time.
 *
 * Validation runs at build time (imported from `next.config.ts`) and at
 * startup, so a misconfigured deployment fails fast instead of at runtime.
 *
 * NOTE: keep this file (and its imports) free of `@/` path aliases. It is loaded by
 * `next.config.ts`, where aliases are not resolved.
 */
export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  },
  // Client vars must be referenced explicitly so Next.js can inline them.
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
  // Treat empty strings as undefined so defaults apply.
  emptyStringAsUndefined: true,
});
