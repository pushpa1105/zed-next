# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Vendor adapters: every third-party library is imported by a single module,
  enforced by ESLint (`VENDOR_ADAPTERS`). New: `@/lib/validation` (Standard Schema),
  `@/lib/cache`, `@/lib/cache-tags`, `@/lib/http-client`, `@/lib/id`, `@/lib/variants`,
  `@/components/icons`, `@/hooks/use-theme`, the test adapter, and Playwright fixtures
  with page objects.
- Central route map (`src/config/routes.ts`).
- HTTP client with timeouts, retries, response validation and error mapping.
- Dependency injection for services (repository, ID generator, clock).
- Coverage gate in CI (90% statements, 85% branches, 90% functions, 90% lines).
- Dependency audit in CI. Grouped Dependabot updates for npm, Actions and Docker.
- `docs/dependencies.md` (adapter map, replacement playbook, upgrade policy),
  ADR-0005, `src/lib/README.md`.

### Changed

- ESLint 9 (end-of-life) → 10. TypeScript 5.9 → 6.0. React 19.3.1. Tailwind CSS 4.3.5.
- All dependencies pinned to exact versions (`savePrefix: ""`).
- `lib/http.ts` renamed to `lib/api-response.ts`.
- `defineAction` accepts any Standard Schema. Field errors are keyed by dotted path.
- The feature generator emits adapter-based, auto-formatted code with a repository.

## [0.1.0] - 2026-11-24

### Added

- Next.js 16.4 App Router starter with Cache Components, Partial Prefetching, React
  Compiler and typed routes.
- Feature-based architecture with lint-enforced boundaries and a feature generator
  (`pnpm gen:feature`).
- Reference `todos` feature: Zod schemas, repository, service, cached query, Server
  Actions, optimistic UI.
- Shared lib: typed Server Action helpers (`ActionResult`), `AppError` hierarchy, HTTP
  error envelope, structured logger.
- Validated environment variables (`@t3-oss/env-nextjs`).
- Tailwind CSS 4 design tokens, dark mode, accessible UI primitives.
- Error boundaries, 404 page, SEO metadata, sitemap, robots, manifest, OG image.
- Proxy with request IDs, security headers, `/api/health`, `instrumentation.ts` hooks.
- Vitest + Testing Library and Playwright test suites.
- ESLint, Prettier, Husky, lint-staged, commitlint, VS Code settings.
- GitHub Actions CI, Dependabot, PR and issue templates, Dockerfile.
- Documentation in `docs/`, ADRs, contributing guide.
