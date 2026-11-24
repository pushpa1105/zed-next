# 0001. Feature-based architecture

- **Status:** Accepted
- **Date:** 2026-11-24

## Context

Organizing by technical type (`components/`, `hooks/`, `services/`, `utils/` at the
top level) works for small apps. As the app grows, it causes problems:

- one change touches files spread across many folders,
- shared folders turn into dumping grounds, with unclear ownership,
- nothing stops any module from importing any other, so coupling grows silently,
- deleting a capability is risky, because its code is everywhere.

The Next.js App Router already colocates routing concerns in `app/`, but it gives no
guidance for business logic.

## Decision

- `app/` is for routing and composition only.
- Business capabilities live in `src/features/<name>/`. Each one is self-contained,
  with its own actions, components, data, queries, schemas and services.
- Each feature exposes a **public API**: `index.ts` (universal) and `server.ts`
  (server-only). Everything else is private.
- Feature-agnostic code lives in shared folders (`components/`, `hooks/`, `lib/`,
  `config/`).
- Dependencies point one way: `app → features → shared`. ESLint
  (`no-restricted-imports`) enforces this in `eslint.config.mjs`.

## Alternatives considered

- **Type-based folders**: rejected for the reasons above.
- **Full Feature-Sliced Design** (app/pages/widgets/features/entities/shared): powerful,
  but more ceremony and vocabulary than most teams need. Our model is a simplified
  subset that can grow towards it.
- **Monorepo packages per domain from day one**: strong isolation, but premature. Clean
  feature APIs keep that move cheap later.

## Consequences

- ✅ High cohesion: a feature can be understood, owned, and deleted as one unit.
- ✅ Boundaries are checked by CI, not code review.
- ✅ Easy to split into packages later.
- ⚠️ Developers must decide "feature or shared?". The feature guide covers it.
- ⚠️ Cross-feature use must go through public APIs, which sometimes means adding
  an export deliberately. That's intended.
