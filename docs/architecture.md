# Architecture

This codebase uses a **feature-based (vertical slice) architecture** on top of the
Next.js App Router. The goal: any engineer can find, change, or delete a business
capability without touching unrelated code.

## The three layers

```
src/
├── app/         1. ROUTING      URLs, layouts, metadata, error/loading boundaries
├── features/    2. FEATURES     business capabilities (todos, billing, auth, …)
└── components/  3. SHARED       feature-agnostic building blocks
    hooks/
    lib/
    config/
```

### 1. `app/`: routing and composition

`app/` is a **thin layer**. A route file:

- maps a URL to UI (`page.tsx`), wraps it in shells (`layout.tsx`) and boundaries
  (`error.tsx`, `loading.tsx`, `not-found.tsx`),
- exports `metadata`,
- **composes** features: fetch with a feature query, render feature components.

It does **not** contain business logic, validation, or data access. If a page grows
beyond composition, that logic belongs in a feature.

Conventions inside `app/`:

- **Route groups** `(name)/` organize routes without changing the URL. `(marketing)`
  is the public site and `(app)` is the product area. Each can have its own layout.
- **Private folders** `_components/` hold UI used by a single route. They are not
  routable. Promote that UI to a feature or to `components/` once a second consumer
  appears.

### 2. `features/<name>/`: business capabilities

Each feature is a self-contained module:

```
features/todos/
├── index.ts          PUBLIC API: components, schemas, types (server + client safe)
├── server.ts         PUBLIC API: queries, services (server only)
├── actions/          Server Actions: validate → authorize → service → invalidate cache
├── components/       React components owned by the feature
├── data/             Repository: the ONLY code that touches the data source
├── queries/          Cached reads: "use cache" + cacheLife + cacheTag
├── schemas/          Zod schemas: the source of truth for data shapes
├── services/         Business rules: framework-agnostic, unit tested
├── constants.ts      Cache tags, limits
└── types.ts          Types inferred from schemas
```

Not every feature needs every folder. Start small and add folders as needed.

#### Inside a feature: who calls whom

```
 components ──calls──▶ actions ──▶ services ──▶ data (repository)
                                       ▲
 app/page ──calls──▶ queries ──────────┘
```

| Layer         | Knows about Next.js? | Responsibility                                                |
| ------------- | -------------------- | ------------------------------------------------------------- |
| `data/`       | No                   | Read/write the data source. Defines an interface + impl.      |
| `services/`   | No                   | Business rules, invariants, authorization checks.             |
| `queries/`    | Yes (`use cache`)    | Cached reads for Server Components.                           |
| `actions/`    | Yes (`use server`)   | Entry point for mutations: validation and cache invalidation. |
| `components/` | Yes (React)          | Presentation and interaction.                                 |

Keeping `services/` and `data/` free of framework code means:

- business logic is unit tested without mocking Next.js,
- the database can change behind the repository interface,
- the same service can later back a REST/GraphQL API, a cron job, or a CLI.

#### Two public entry points

| Import                    | Contains                              | Usable from     |
| ------------------------- | ------------------------------------- | --------------- |
| `@/features/todos`        | components, schemas, types, constants | Server + Client |
| `@/features/todos/server` | queries, services                     | Server only     |

`server.ts` starts with `import "server-only"`, so a Client Component that imports it
fails the build. Server code can't leak into the browser bundle.

### 3. Shared code

| Folder                  | Contains                                                                                |
| ----------------------- | --------------------------------------------------------------------------------------- |
| `components/ui/`        | Design-system primitives (Button, Input, Card…). No business logic.                     |
| `components/layout/`    | App chrome: header, footer, navigation, theme toggle                                    |
| `components/feedback/`  | Error views and other status UI                                                         |
| `components/providers/` | Client context providers, composed in `AppProviders`                                    |
| `components/icons.tsx`  | Icon registry (semantic names). The only importer of the icon library                   |
| `hooks/`                | Generic React hooks, incl. the `useTheme` adapter                                       |
| `lib/`                  | Infrastructure and **vendor adapters**. See [`src/lib/README.md`](../src/lib/README.md) |
| `config/`               | `env.ts` (validated env vars), `site.ts` (site metadata), `routes.ts` (every URL)       |

### Vendor adapters

Third-party libraries are never imported directly by application code. Each one
has a single adapter module (for example `@/lib/validation` for Zod, or
`@/components/icons` for lucide), so upgrading or replacing it is a one-file change.
See [dependencies](dependencies.md) and [ADR-0005](adr/0005-vendor-adapters.md).

## Dependency rules

Dependencies point **down only**:

```
app  ──▶  features  ──▶  shared (components, hooks, lib, config)
```

| Rule                                                                            | Enforced by |
| ------------------------------------------------------------------------------- | ----------- |
| Shared code must not import from `features/` or `app/`                          | ESLint      |
| Features must not import from `app/`                                            | ESLint      |
| Outside code imports a feature only via `@/features/x` or `@/features/x/server` | ESLint      |
| Inside a feature, use **relative** imports (`../services/...`)                  | Convention  |
| Server-only modules start with `import "server-only"`                           | Build error |
| Third-party libraries are imported only by their adapter                        | ESLint      |
| Next.js cache APIs are called only through `@/lib/cache`                        | ESLint      |

The rules live in [`eslint.config.mjs`](../eslint.config.mjs) (`no-restricted-imports`).
A violation fails `pnpm lint`, the pre-commit hook, and CI.

### Cross-feature dependencies

A feature may use another feature through its **public API**, for example
`import { UserAvatar } from "@/features/users"`. Keep these links few and one-way.
If two features keep needing each other:

- move the shared piece down into `components/` or `lib/`, or
- merge the features, or
- compose them in `app/` (the page passes data from one to the other).

Circular feature dependencies are a design smell. Treat them as a signal to refactor.

## Request lifecycle

### Reading data (page render)

```
Browser ─▶ proxy.ts (adds x-request-id)
        ─▶ app/(app)/todos/page.tsx            static shell (prerendered)
             └─ <Suspense> TodosSection
                  └─ getTodos()   "use cache" + applyCachePolicy(tags: ["todos"])
                       └─ todoService.list() ─▶ todoRepository.list()
        ◀─ HTML shell + streamed RSC payload
```

With **Cache Components**, everything that doesn't depend on request data is
prerendered at build time into a static shell. Cached data (`use cache`) is part of
that shell. Request-specific data streams in behind `<Suspense>`.

### Writing data (Server Action)

```
<TodoList> (client)
  ├─ useOptimistic: UI updates instantly
  └─ toggleTodo({ id, completed })              Server Action = POST endpoint
        ├─ schema validation (defineAction)          → { ok:false, fieldErrors }
        ├─ todoService.toggle()                   → NotFoundError → { ok:false }
        ├─ expireCacheTags("todos")               expire cached reads
        └─ return { ok:true, data }
  ◀─ React re-renders with fresh server data
```

## Server vs. Client Components

- Components are **Server Components by default**. Add `"use client"` only for
  state, effects, event handlers, or browser APIs.
- Push `"use client"` as far **down** the tree as possible. In the todos feature, the
  page and data fetching are server code, while only the form and list are client
  components.
- Pass **serializable** props from server to client (no class instances or functions,
  except Server Actions).

## Further reading

- [Feature guide](feature-guide.md): build a feature step by step
- [Data fetching & caching](data-and-caching.md)
- [ADR-0001: Feature-based architecture](adr/0001-feature-based-architecture.md)
