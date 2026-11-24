# Dependencies: adapters, upgrades and replacements

Libraries come and go faster than products do. Over the life of this codebase, most
third-party packages will need a major upgrade, and some will be abandoned or
replaced. This page explains how the code is set up so that each of those changes
touches **one file**, not hundreds.

## The rule

> **Every third-party library is imported by exactly one adapter module.**
> Application code imports the adapter, never the library.

ESLint enforces this rule (`VENDOR_ADAPTERS` in [`eslint.config.mjs`](../eslint.config.mjs)).
Importing a library directly fails `pnpm lint`, the pre-commit hook, and CI, with a
message that names the adapter to use instead.

```
 feature code ──▶ @/lib/validation ──▶ zod
 feature code ──▶ @/components/icons ──▶ lucide-react
 feature code ──▶ @/lib/cache ──▶ next/cache
                    ▲
         the only file that changes when the library does
```

Adapters also give the codebase **its own vocabulary**. Components use `DeleteIcon`,
not `Trash2`; services use `generateId()`, not `crypto.randomUUID()`; queries use
`applyCachePolicy()`, not three Next.js calls. That vocabulary stays the same while
the implementation behind it changes.

## Adapter map

| Concern            | Library today                | Adapter (only importer)                                                 | App code uses                                                         |
| ------------------ | ---------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Validation/schemas | `zod`                        | `src/lib/validation.ts`                                                 | `z`, `validate`, `InferOutput`, `StandardSchema`                      |
| Env variables      | `@t3-oss/env-nextjs`         | `src/config/env.ts`                                                     | `env`                                                                 |
| Caching            | `next/cache` (cache APIs)    | `src/lib/cache.ts`                                                      | `applyCachePolicy`, `expireCacheTags`, `refreshCacheTagsInBackground` |
| Cache tag naming   | none                         | `src/lib/cache-tags.ts`                                                 | `createCacheTags`                                                     |
| Outbound HTTP      | `fetch`                      | `src/lib/http-client.ts`                                                | `createHttpClient`                                                    |
| IDs                | `crypto.randomUUID`          | `src/lib/id.ts`                                                         | `generateId`                                                          |
| Logging            | `console`                    | `src/lib/logger.ts`                                                     | `logger`, `logger.child()`                                            |
| Class names        | `clsx`, `tailwind-merge`     | `src/lib/utils.ts`                                                      | `cn`                                                                  |
| Component variants | `class-variance-authority`   | `src/lib/variants.ts`                                                   | `variants`, `VariantProps`                                            |
| Icons              | `lucide-react`               | `src/components/icons.tsx`                                              | semantic names: `AddIcon`, `DeleteIcon`, …                            |
| Theme              | `next-themes`                | `src/components/providers/theme-provider.tsx`, `src/hooks/use-theme.ts` | `ThemeProvider`, `useTheme`                                           |
| Unit test tools    | `@testing-library/*`         | `src/test/utils.tsx`, `src/test/setup.ts`                               | `renderWithUser`, `screen`, `renderHook`, …                           |
| E2E test tools     | `@playwright/test`           | `e2e/fixtures.ts`, `e2e/pages/*`                                        | `test`, `expect`, page objects                                        |
| Server Actions     | Next.js + validation adapter | `src/lib/actions.ts`                                                    | `defineAction`, `defineFormAction`, `ActionResult`                    |
| API responses      | Web `Response`               | `src/lib/api-response.ts`                                               | `withErrorHandling`, `errorResponse`                                  |

### What is deliberately _not_ wrapped

- **Next.js and React themselves.** They are the platform, not a library you swap.
  `next/link`, `next/navigation`, `next/image` and React hooks are used directly.
  The exception is the volatile part, the cache APIs, which go through `@/lib/cache`.
- **The `"use cache"` and `"use server"` directives.** They are compiler directives,
  so they must stay inline.
- **Schema definitions.** Feature schemas are written with `z` (re-exported from
  `@/lib/validation`). Changing schema libraries means rewriting the schema files,
  but nothing that _consumes_ them. See below.
- **Vitest** (`describe`, `it`, `vi`). The test runner's API is stable and ubiquitous,
  and it's Jest-compatible if you ever move back.

## How to replace a library (playbook)

1. **Open the adapter.** It's the only file importing the library (see the map).
2. **Re-implement the adapter's exported API** with the new library. Keep the names
   and types the same, so call sites don't change.
3. **Update the adapter's tests.** Every adapter has a test file that pins its
   behaviour (for example `lib/__tests__/validation.test.ts`, `lib/__tests__/http-client.test.ts`,
   `hooks/__tests__/use-theme.test.ts`).
4. **Update `VENDOR_ADAPTERS`** in `eslint.config.mjs` (the package name), then
   remove the old package with `pnpm remove <old>`.
5. **Run `pnpm check && pnpm build && CI=1 pnpm test:e2e`.**
6. **Record the decision** in an ADR if the swap is significant.

### Worked examples

**Icons: lucide → another set.** Edit `src/components/icons.tsx` so it re-exports
the new set's glyphs under the same semantic names. Nothing else changes.

**Variants: cva → tailwind-variants.** Edit `src/lib/variants.ts` so it exports
`variants` and `VariantProps` backed by `tv()`. Adjust the call shape inside the
adapter if needed.

**Validation: Zod → Valibot.** Server Actions, the HTTP client, env and types
already depend on the vendor-neutral [Standard Schema](https://standardschema.dev)
interface, which Valibot implements. So:

1. In `src/lib/validation.ts`, export Valibot (`export * as v from "valibot"`)
   alongside, or instead of, `z`.
2. Rewrite schema files feature by feature. Both libraries can coexist during the
   migration, because consumers accept any Standard Schema.
3. Remove Zod once the last schema is migrated.

**Theme: next-themes → custom.** Re-implement `ThemeProvider` and `useTheme()`
(same `ThemeApi` shape). Components keep calling `useTheme().setPreference(...)`.

**Next.js cache API changes.** When a Next.js major renames or changes cache
functions, update `src/lib/cache.ts`. Features keep calling `applyCachePolicy` and
`expireCacheTags`.

## Adding a new library

1. Ask whether the platform already covers it (`fetch`, `Intl`, `crypto`,
   `URL`, React 19 APIs). The best dependency is no dependency.
2. Check its health: maintenance activity, release cadence, TypeScript support,
   bundle size, license, and open security advisories.
3. Create the adapter in the right layer (`src/lib/` for logic,
   `src/components/` for UI), exposing **your** API in **your** vocabulary.
4. Add a row to `VENDOR_ADAPTERS` in `eslint.config.mjs` and to the map above.
5. Write a test for the adapter.

Small single-purpose utilities used in one place may not need an adapter yet. Add
one as soon as a second file needs the library.

## Versions and upgrades

| Policy                            | How it's enforced                                       |
| --------------------------------- | ------------------------------------------------------- |
| Exact versions (no `^`/`~`)       | `savePrefix: ""` in `pnpm-workspace.yaml`               |
| Reproducible installs             | `pnpm-lock.yaml` + `--frozen-lockfile` in CI and Docker |
| One pnpm version for everyone     | `packageManager` field + Corepack                       |
| Supported Node.js                 | `.nvmrc`, `engines`, Docker base image                  |
| Upgrades arrive as reviewed PRs   | Dependabot (weekly, grouped), with the full CI suite    |
| Known-vulnerable deps are blocked | `pnpm audit --prod --audit-level high` in CI            |

Exact pins mean nothing changes without a pull request. Dependabot groups related
packages (for example Next.js + React + `eslint-config-next`), so they're upgraded
together, the way they're released and tested.

### Upgrade routine

- **Weekly:** review and merge the Dependabot PRs. CI is the gate.
- **Major versions:** one PR per major. Read the changelog or migration guide first.
  For Next.js, read `node_modules/next/dist/docs/01-app/02-guides/upgrading/` after
  installing. Because of the adapters, most majors touch only the adapter file.
- **Node.js:** move to each new LTS when it's released. Update `.nvmrc`,
  `engines`, `@types/node` (same major), and the `FROM` lines in the `Dockerfile`
  together.
- **Security releases:** patch immediately, outside the weekly cycle.

### Known constraints

Update this list when a constraint is resolved.

| Constraint                                  | Why                                                                                                                                                                                              | Unblock when                                                                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| TypeScript pinned to **6.0.x** (7.x exists) | `typescript-eslint` (used by `eslint-config-next`) supports TS < 6.1, and the Next.js editor plugin needs the TypeScript JS API, which TS 7 doesn't ship yet. Next.js itself can build with TS 7 | `typescript-eslint` declares TS 7 support. Then remove the Dependabot `ignore` entry                             |
| ESLint **10** with relaxed peer ranges      | ESLint 9 is end-of-life. `eslint-plugin-react`, `-import` and `-jsx-a11y` work on 10 (verified with lint probes), but haven't widened their peer ranges                                          | Each plugin declares ESLint 10 support. Then remove its line from `peerDependencyRules` in `pnpm-workspace.yaml` |
| `@types/node` on the **24.x** major         | Must match the runtime in `.nvmrc` and the Docker image                                                                                                                                          | You move the runtime to the next LTS                                                                             |
