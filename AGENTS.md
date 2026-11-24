<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project rules for coding agents

Read `docs/architecture.md` before making structural changes. Summary:

## Architecture

- `src/app/` is routing and composition only: no business logic, validation, or data access.
- Business capabilities live in `src/features/<name>/`. Use `pnpm gen:feature <name>` to scaffold one.
- Import a feature only via `@/features/<name>` (universal) or `@/features/<name>/server` (server-only). Use relative imports inside a feature.
- Dependencies point down: `app -> features -> shared (components, hooks, lib, config)`. ESLint enforces this; do not disable the rule.
- Layering inside a feature: `components -> actions -> services -> data`, and `app page -> queries -> services`. Services and repositories have no Next.js imports.

## Patterns to follow

- **Never import a third-party library directly.** Use its adapter: `@/lib/validation` (zod), `@/lib/cache` (next/cache APIs), `@/lib/variants` (cva), `@/lib/utils` (`cn`), `@/components/icons` (lucide), `@/hooks/use-theme` (next-themes), `@/test/utils` (Testing Library), `e2e/fixtures` (Playwright). New library = new adapter + a row in `VENDOR_ADAPTERS` in `eslint.config.mjs`. See `docs/dependencies.md`.
- Types come from schemas via `InferOutput<typeof schema>` from `@/lib/validation`. Do not hand-write duplicate types.
- Server Actions: use `defineAction` / `defineFormAction` from `@/lib/actions`, return `ActionResult`, and call `expireCacheTags(<feature>CacheTags.all)` after writes. Check authorization in every action.
- Reads: `"use cache"` + `applyCachePolicy({ lifetime, tags })` in `queries/`. Wrap request-dependent UI in `<Suspense>`.
- Services take injected dependencies (`repo`, `generateId`, `now`). Use `generateId` from `@/lib/id`, not `crypto.randomUUID`.
- External APIs: `createHttpClient` from `@/lib/http-client`, always with a response `schema`.
- URLs: `routes` from `@/config/routes`, not string literals.
- Expected failures: throw `AppError` subclasses from `@/lib/errors`. Never expose raw error messages to users.
- Logging: `logger` from `@/lib/logger`, never `console.log`.
- Env vars: declare them in `src/config/env.ts` and `.env.example`, and read them via `env`, never `process.env`, in app code.
- Styling: Tailwind with semantic tokens (`bg-primary`, `text-muted-foreground`), `cn()` and `variants()`. No raw palette colours. Icons by semantic name from `@/components/icons`.
- Tests: import helpers from `@/test/utils`. E2E specs use `./fixtures` and the page objects in `e2e/pages/`. Keep coverage above the thresholds in `vitest.config.mts`.
- Dependencies are pinned exactly. Do not add `^` ranges. Check `docs/dependencies.md#known-constraints` before upgrading TypeScript or ESLint.
- Error boundaries receive `{ error: unknown, retry }` (Next 16.2+). Middleware is now `src/proxy.ts`.

## Verify before finishing

```bash
pnpm check                    # lint + typecheck + format:check + unit tests
pnpm build && CI=1 pnpm test:e2e
```

Update `docs/` when you change behaviour or conventions. Add an ADR for significant decisions.
