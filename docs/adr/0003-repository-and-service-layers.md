# 0003. Repository and service layers inside features

- **Status:** Accepted
- **Date:** 2026-11-24

## Context

Putting database calls and business rules directly in Server Actions or components is
fast to write. But it couples business logic to the framework and the database, makes
unit testing hard, and scatters rules across entry points.

## Decision

Inside a feature:

- `data/` defines a **repository interface** plus an implementation. It's the only
  code that talks to the data source.
- `services/` holds **business rules and authorization**. It's created with a factory
  (`createXService(repo)`) so tests can inject a fake, and has no Next.js imports.
- `actions/` and `queries/` are thin framework adapters over services.

## Alternatives considered

- **Call the ORM directly from actions**: less code, but rules get duplicated across
  actions and need framework mocks to test.
- **A full DDD / hexagonal setup** (entities, value objects, use-case classes, DI
  container): too much ceremony for most product teams.

## Consequences

- ✅ Business rules are unit tested in milliseconds.
- ✅ The data source can be swapped (in-memory → Postgres) by changing one export.
- ✅ The same service can serve actions, Route Handlers, jobs and scripts.
- ⚠️ A bit more code for trivial CRUD. For very simple features, a service can be a
  thin pass-through, which is acceptable.
