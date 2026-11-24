# 0002. Cache Components and Server Actions for data

- **Status:** Accepted
- **Date:** 2026-11-24

## Context

Next.js 16 offers a caching model (Cache Components: `"use cache"`, `cacheLife`,
`cacheTag`, Partial Prefetching) that `create-next-app` enables by default. It
replaces the implicit `fetch` caching and route segment config of earlier versions.

We need one consistent way to read and write data that is fast, type-safe, and easy
to reason about.

## Decision

- Enable `cacheComponents` and `partialPrefetching`.
- **Reads**: feature `queries/` functions use `"use cache"` with an explicit
  `cacheLife` and at least one `cacheTag`. Request-dependent UI streams behind
  `<Suspense>`.
- **Writes**: Server Actions only, defined with `defineAction` / `defineFormAction`
  (`src/lib/actions.ts`). They validate with Zod, return a typed `ActionResult`, and
  invalidate with `updateTag` (read-your-own-writes) or `revalidateTag(tag, "max")`
  (background refresh).
- No client data library by default.

## Alternatives considered

- **Previous caching model** (`fetch` cache options, `revalidate` exports): still
  supported, but legacy. Mixing models is confusing.
- **REST Route Handlers + TanStack Query for everything**: more code, a duplicated
  validation layer, and no static shell. Still available for client-heavy cases.
- **tRPC / next-safe-action**: good libraries, but our needs fit in a ~100-line helper
  that we fully control.

## Consequences

- ✅ Fast first paint (static shell), with explicit and auditable cache lifetimes.
- ✅ One mutation pattern everywhere, with consistent error handling.
- ⚠️ Developers must learn the rules of `"use cache"` (serializable args, no
  `cookies()` inside). These are documented in `docs/data-and-caching.md`.
- ⚠️ Multi-instance deployments need a shared cache handler.
