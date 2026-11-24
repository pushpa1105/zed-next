# Documentation

Developer documentation for this codebase. Start with **Getting started**, then
**Architecture**. The other pages are references to read when you need them.

## Start here

1. [Getting started](getting-started.md): install, run, editor setup
2. [Architecture](architecture.md): layers, dependency rules, request lifecycle
3. [Feature guide](feature-guide.md): build a feature end-to-end

## Reference

- [Conventions](conventions.md): naming, files, components, TypeScript, git
- [Data fetching & caching](data-and-caching.md): `use cache`, tags, Server Actions
- [Error handling](error-handling.md): `AppError`, `ActionResult`, error boundaries
- [Styling & UI](styling.md): design tokens, variants, dark mode
- [Environment variables](environment-variables.md): adding and validating config
- [Testing](testing.md): Vitest, Testing Library, Playwright
- [Security](security.md): auth, input validation, headers, CSP
- [Observability](observability.md): logging, request IDs, error reporting, health
- [Deployment](deployment.md): Vercel, Docker, self-hosting
- [Dependencies](dependencies.md): adapters, upgrading and replacing libraries
- [Extending](extending.md): recipes for auth, database, i18n, and more

## Decisions

- [Architecture Decision Records](adr/README.md)

## Keeping docs alive

Docs are code. Update them in the same pull request that changes behaviour or
conventions. The PR template has a checkbox for this. When you make a significant
architectural decision, add an ADR.
