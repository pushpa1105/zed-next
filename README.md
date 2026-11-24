# Zed Next

An enterprise-grade **Next.js 16** starter with a **feature-based architecture**, strict
tooling, testing, CI/CD and documentation in place from day one.

```
Next.js 16.4 (App Router, Turbopack, Cache Components, React Compiler)
React 19.3 · TypeScript 6 (strict) · Tailwind CSS 4 · Zod 4 (via Standard Schema)
Vitest + Testing Library · Playwright · ESLint 10 · Prettier
Husky + lint-staged + commitlint · GitHub Actions · Docker
```

---

## Table of contents

- [Why this starter](#why-this-starter)
- [Quick start](#quick-start)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Architecture in 60 seconds](#architecture-in-60-seconds)
- [What's included](#whats-included)
- [Documentation](#documentation)
- [Make it yours](#make-it-yours)

---

## Why this starter

Most starters are fine for a weekend project but turn messy as soon as a team and a
dozen features arrive. This one is built around a few rules that keep a large codebase
manageable:

1. **Organize by feature, not by file type.** Everything about "todos" lives in
   `src/features/todos`.
2. **Enforce boundaries with tooling, not good intentions.** ESLint fails the build if
   a feature's internals are imported from outside, or if shared code depends on a
   feature.
3. **Make the right thing the easy thing.** One way to write a Server Action
   (`defineAction`), one error model (`AppError`), one logger, one env schema, and a
   generator (`pnpm gen:feature`) that scaffolds all of it.
4. **Keep every library replaceable.** Each third-party package is imported by exactly
   one adapter file (lint-enforced). Upgrading or swapping a library is a one-file
   change. See [docs/dependencies.md](docs/dependencies.md).
5. **Nothing changes by accident.** Versions are pinned exactly, and upgrades arrive as
   grouped Dependabot PRs gated by lint, types, a 90% coverage gate, E2E tests and
   a security audit.
6. **Document decisions.** The `docs/` folder explains _how_ and _why_, and
   [ADRs](docs/adr) record architectural choices.

## Quick start

**Requirements:** Node.js ≥ 22 (see `.nvmrc`, Node 24 recommended) and pnpm 10
(`corepack enable`).

```bash
pnpm install                 # also installs git hooks (husky)
cp .env.example .env.local   # then adjust values
pnpm dev                     # http://localhost:3000
```

Open <http://localhost:3000/todos> to see the reference feature in action.

Before pushing, run the same checks as CI:

```bash
pnpm check        # lint + typecheck + format check + unit tests
pnpm build && pnpm test:e2e
```

## Scripts

| Script                         | What it does                                        |
| ------------------------------ | --------------------------------------------------- |
| `pnpm dev`                     | Start the dev server (Turbopack)                    |
| `pnpm build`                   | Production build                                    |
| `pnpm start`                   | Serve the production build                          |
| `pnpm lint` / `lint:fix`       | ESLint (incl. architecture boundary rules)          |
| `pnpm typecheck`               | Generate route types, then `tsc --noEmit`           |
| `pnpm format` / `format:check` | Prettier (with Tailwind class sorting)              |
| `pnpm test`                    | Unit/component tests (Vitest, single run)           |
| `pnpm test:watch`              | Vitest in watch mode                                |
| `pnpm test:coverage`           | Unit tests + coverage gate (fails below thresholds) |
| `pnpm test:e2e`                | Playwright E2E tests (starts the app automatically) |
| `pnpm test:e2e:ui`             | Playwright UI mode                                  |
| `pnpm check`                   | Everything CI checks, except build + E2E            |
| `pnpm gen:feature <name>`      | Scaffold a new feature module                       |
| `pnpm clean`                   | Remove build and test artifacts                     |

## Project structure

```
.
├── .github/                 CI workflow, Dependabot, PR and issue templates
├── .husky/                  Git hooks: lint-staged (pre-commit), commitlint (commit-msg)
├── docs/                    Developer documentation and ADRs (start at docs/README.md)
├── e2e/                     Playwright specs, fixtures.ts (adapter), pages/ (page objects)
├── public/                  Static assets served as-is
├── scripts/                 Developer tooling (feature generator)
└── src/
    ├── app/                 ROUTING ONLY: pages, layouts, route handlers, metadata
    │   ├── (marketing)/     Public pages (route group: no URL segment)
    │   │   └── _components/ Route-private UI (not routable)
    │   ├── (app)/           Application area (where auth gates would live)
    │   │   └── todos/       page.tsx, error.tsx
    │   ├── api/health/      Health-check Route Handler
    │   ├── layout.tsx       Root layout: fonts, providers, header/footer, metadata
    │   ├── error.tsx        Error boundary for all routes
    │   ├── global-error.tsx Last-resort boundary for the root layout
    │   ├── not-found.tsx    404 page
    │   └── robots.ts, sitemap.ts, manifest.ts, opengraph-image.tsx
    │
    ├── features/            BUSINESS FEATURES: one folder per domain capability
    │   └── todos/
    │       ├── index.ts     Public API (client + server safe)
    │       ├── server.ts    Public API (server only)
    │       ├── actions/     Server Actions
    │       ├── components/  Feature UI
    │       ├── data/        Repository (data access)
    │       ├── queries/     Cached reads ("use cache")
    │       ├── schemas/     Schemas = source of truth for types
    │       ├── services/    Business rules
    │       ├── constants.ts
    │       └── types.ts
    │
    ├── components/          SHARED UI, with no business logic
    │   ├── ui/              Design-system primitives (Button, Input, Card…)
    │   ├── layout/          Header, footer, nav, theme toggle
    │   ├── feedback/        Error views and other status UI
    │   ├── providers/       Client context providers (composed in AppProviders)
    │   └── icons.tsx        Icon registry (adapter): semantic icon names
    ├── config/              env.ts (validated env), site.ts (metadata), routes.ts (every URL)
    ├── hooks/               Shared React hooks (incl. useTheme adapter)
    ├── lib/                 Infrastructure + vendor adapters (see src/lib/README.md):
    │                        actions, api-response, cache, cache-tags, errors,
    │                        http-client, id, logger, utils, validation, variants
    ├── test/                Test adapter (utils.tsx) and setup
    ├── instrumentation.ts   Server start-up + global server error reporting
    └── proxy.ts             Runs before requests (request IDs). Formerly "middleware"
```

## Architecture in 60 seconds

```
          ┌──────────────────────────────────────────────┐
          │  app/      routing & composition             │
          └───────────────┬──────────────────────────────┘
                          │ imports public APIs only
          ┌───────────────▼──────────────────────────────┐
          │  features/<name>   index.ts │ server.ts      │
          │   actions → services → data (repository)     │
          │   queries → services                         │
          │   components → actions                       │
          └───────────────┬──────────────────────────────┘
                          │
          ┌───────────────▼──────────────────────────────┐
          │  shared: components/ hooks/ lib/ config/     │
          │  ── vendor adapters (the only importers) ──  │
          └───────────────┬──────────────────────────────┘
                          │
                 zod · lucide · next-themes · cva · next/cache …
   Dependencies point DOWN only. ESLint enforces it.
```

- **Reads**: Server Components call `getX()` queries, which use `"use cache"` +
  `applyCachePolicy()` and become part of the prerendered shell.
- **Writes**: Client components call Server Actions built with `defineAction` /
  `defineFormAction`. Actions validate input against a schema, call a service, and
  call `expireCacheTags()` so the UI shows fresh data at once.
- **Errors**: expected failures are `AppError`s, returned to the UI as
  `ActionResult` values. Unexpected ones hit error boundaries and are logged by
  `instrumentation.ts`.

Read more in [docs/architecture.md](docs/architecture.md).

## What's included

| Area          | What you get                                                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Framework     | Next.js 16 App Router, Turbopack, Cache Components + Partial Prefetching, React Compiler, typed routes                             |
| Type safety   | Strict TS (`noUncheckedIndexedAccess`, …), validated env vars, schema-derived types, typed routes (`config/routes.ts`)             |
| Longevity     | Vendor adapters for every library (lint-enforced), Standard Schema validation, exact version pins, upgrade playbook                |
| Architecture  | Feature modules with public APIs, repository → service → action/query layers, lint-enforced boundaries                             |
| Data          | `"use cache"` queries with tags, typed Server Actions (`ActionResult`), HTTP client (timeouts, retries, validation), optimistic UI |
| UI            | Tailwind CSS 4 design tokens, light/dark theme, semantic icon registry, accessible primitives with typed variants                  |
| Errors        | `AppError` hierarchy, route error boundaries, `global-error`, 404, error digests, safe messages                                    |
| Observability | Structured JSON logger, request IDs (proxy), `onRequestError` hook, `/api/health`                                                  |
| Security      | Security headers, `server-only` guards, validated actions, no `X-Powered-By`, CSP guidance                                         |
| SEO           | Metadata API, title template, Open Graph image, `robots.txt`, `sitemap.xml`, web manifest                                          |
| Testing       | Vitest + Testing Library, Playwright (desktop + mobile) with page objects, 90% coverage gate                                       |
| DX            | ESLint 10 flat config, Prettier + Tailwind plugin, import sorting, Husky, lint-staged, commitlint, VS Code settings                |
| Delivery      | GitHub Actions (audit, quality, E2E, Docker), grouped Dependabot updates, multi-stage Docker image with health check               |
| AI agents     | `AGENTS.md` / `CLAUDE.md` with project rules for coding agents                                                                     |

## Documentation

| Doc                                                    | Read it when you…                            |
| ------------------------------------------------------ | -------------------------------------------- |
| [Getting started](docs/getting-started.md)             | set up your machine for the first time       |
| [Architecture](docs/architecture.md)                   | want to understand how the code is organized |
| [Feature guide](docs/feature-guide.md)                 | build a new feature                          |
| [Conventions](docs/conventions.md)                     | name files, write components, commit         |
| [Data fetching & caching](docs/data-and-caching.md)    | read or write data                           |
| [Error handling](docs/error-handling.md)               | handle failures                              |
| [Styling & UI](docs/styling.md)                        | build UI or change the theme                 |
| [Environment variables](docs/environment-variables.md) | add configuration                            |
| [Testing](docs/testing.md)                             | write unit, component or E2E tests           |
| [Security](docs/security.md)                           | add auth, handle user input, add a CSP       |
| [Observability](docs/observability.md)                 | log, trace or monitor                        |
| [Deployment](docs/deployment.md)                       | ship to Vercel, Docker or another platform   |
| [Dependencies](docs/dependencies.md)                   | add, upgrade or replace a library            |
| [Extending](docs/extending.md)                         | add auth, a database, i18n, Storybook, etc.  |
| [ADRs](docs/adr/README.md)                             | want to know _why_ a decision was made       |
| [Contributing](CONTRIBUTING.md)                        | open a pull request                          |

## Make it yours

- [ ] Rename the project in `package.json` and `src/config/site.ts`
- [ ] Update `siteConfig.links.repo` and the OG image in `src/app/opengraph-image.tsx`
- [ ] Replace `src/app/favicon.ico` and add icons (`icon.png`, `apple-icon.png`)
- [ ] Set `NEXT_PUBLIC_APP_URL` for each environment
- [ ] Replace the in-memory todo repository with a real database, or delete the
      `todos` feature once you have your own (see [docs/extending.md](docs/extending.md))
- [ ] Choose a license and add a `LICENSE` file
- [ ] Add a `CODEOWNERS` file with your team handles
- [ ] Enable branch protection on `main` that requires the CI checks
