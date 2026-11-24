# 0004. Tooling baseline

- **Status:** Accepted
- **Date:** 2026-11-24

## Context

Consistency across a team comes from automation, not style guides.

## Decision

| Concern              | Choice                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| Package manager      | pnpm (version pinned via `packageManager` + Corepack)                                              |
| Language             | TypeScript, `strict` + `noUncheckedIndexedAccess`                                                  |
| Lint                 | ESLint 10 flat config: `eslint-config-next` (core-web-vitals + TS), import sorting, boundary rules |
| Format               | Prettier + `prettier-plugin-tailwindcss`                                                           |
| Unit/component tests | Vitest + Testing Library + jest-dom                                                                |
| E2E tests            | Playwright                                                                                         |
| Git hooks            | Husky + lint-staged (pre-commit), commitlint (Conventional Commits)                                |
| CI                   | GitHub Actions: quality, E2E, and Docker build                                                     |
| Dependencies         | Dependabot with grouped updates                                                                    |

## Alternatives considered

- **Biome** instead of ESLint + Prettier: much faster, but it can't yet express our
  Next.js-specific and boundary rules as well. Worth revisiting.
- **Jest**: slower, and its ESM/TS setup is clunkier than Vitest's.
- **npm/yarn**: pnpm is faster and stricter about phantom dependencies.

## Consequences

- ✅ The same checks run in the editor, on commit, and in CI.
- ⚠️ Tool upgrades (ESLint 10, TypeScript 7) need deliberate migration PRs.
  Dependabot groups them to make this manageable.

## Amendments

- **2026-11-24:** Upgraded ESLint 9 → 10, because ESLint 9 reached end-of-life.
  TypeScript is pinned to 6.0.x until `typescript-eslint` supports TypeScript 7.
  Dependencies are now pinned to exact versions. Current constraints are tracked in
  [docs/dependencies.md](../dependencies.md#known-constraints). Third-party
  libraries are isolated behind adapters ([ADR-0005](0005-vendor-adapters.md)).
