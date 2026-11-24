# 0005. Isolate third-party libraries behind adapters

- **Status:** Accepted
- **Date:** 2026-11-24

## Context

The codebase is expected to live for many years. Over that time, most dependencies
will ship breaking majors, and some will be abandoned or replaced by better options.
This has already happened within a single Next.js major line (`unstable_cache` →
`"use cache"`, `revalidateTag` signature changes, middleware → proxy).

When library imports are scattered across the codebase, each of these events turns
into a sweeping, risky change, so teams postpone upgrades and fall behind on security
fixes.

## Decision

- Each third-party library is imported by **one adapter module** (or a small,
  named set of them). Application code imports the adapter.
- Adapters expose the project's **own vocabulary and types**: semantic icon names,
  `ThemeApi`, `applyCachePolicy`, `ActionResult`, `StandardSchema`. They don't
  re-export vendor types where that can be avoided.
- Schema _consumers_ depend on the vendor-neutral Standard Schema interface, so the
  validation library can be swapped incrementally.
- The rule is enforced by ESLint (`VENDOR_ADAPTERS` in `eslint.config.mjs`).
  Violations fail CI.
- Adapters are covered by tests that pin their behaviour, so a re-implementation
  can be verified.
- Dependencies are pinned exactly and upgraded through Dependabot PRs gated by CI.

Next.js and React themselves are not wrapped (they're the platform), except for the
cache APIs, which have changed most often.

## Alternatives considered

- **Use libraries directly everywhere**: the least code today, but the highest cost
  at every upgrade or replacement.
- **A dependency-injection container**: more indirection and ceremony than a module
  boundary gives us. Plain modules and factory functions are enough.
- **Wrap everything, including React and Next.js**: leaky, and it fights the
  framework. That cost isn't justified for the platform layer.

## Consequences

- ✅ Upgrading or replacing a library is usually a one-file change plus its tests.
- ✅ The codebase reads in domain terms (`DeleteIcon`, `generateId`).
- ✅ Adapters are natural places for cross-cutting concerns (timeouts, retries,
  logging, tracing).
- ⚠️ A little extra code per library, and developers must add an icon or helper to
  the adapter before using it. ESLint tells them where.
- ⚠️ Adapters must stay thin. Business logic doesn't belong in them.
